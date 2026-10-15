export const WORKSPACE_EFFECTS_CONFIG = {
  maxDeltaMs: 33,
  maxDevicePixelRatio: 2,
  keyPitchWidthRatio: 0.3,
  handScaleWidthRatio: 0.62,
  keyPitchHeightRatio: 1.24,
  palmUnits: 2.3,
  keyboardSidePaddingKeys: 15,
  keyOcclusionRadiusKeys: 0.45,
  keyLabelAlpha: 0.55,
  keyStrikeDurationMs: 140,
  handBoxAlpha: 0.45,
  boneAlpha: 0.55,
  jointRadiusPx: 1.6,
  fingertipRadiusPx: 2,
  mouseWidthKeys: 1.5,
  mouseHeightKeys: 2.6,
  travelBaseMs: 90,
  travelLogScaleMs: 70,
  travelMinMs: 90,
  travelMaxMs: 240,
  yawMaxDegrees: 8,
  yawVelocityScale: 12,
  breathingAmplitudePx: 1,
  twitchAmplitude: 0.1,
  twitchIntervalMs: [6000, 12000],
  mouseHandLeadMs: 35,
  mouseWristXOffsetPalmUnits: 0.12,
  mouseWristYOffsetPalmUnits: 0.68,
  mouseClickDurationMs: 90,
  mouseClickDipPx: 1,
  travelArcRatio: 0.12,
  anticipateDurationMs: 25,
  anticipateRetractKeys: 0.04,
  strikeDurationMs: 55,
  strikeHoldMs: 40,
  sympatheticFlexRatio: 0.18,
  boxJitterPx: 0.6,
  boxJitterIntervalMs: 90,
  strikeHighlightMs: 80,
  keyQueueFlushMs: 40,
  pointerFilterThresholdPx: 2,
  queuedKeyLeftHandFallbackMs: 250,
  labelDigits: 7,
  confidenceMin: 0.3,
  confidenceMax: 0.97,
  confidenceBase: 0.88,
  confidenceSpeedFactor: 0.00035,
  confidenceNoiseAmplitude: 0.06,
  wristOmega: 10,
  fingerOmega: 40,
  mouseOmega: 16,
  boxOmega: 18,
  travelOmega: 12,
  grabDistancePx: 24,
  grabWindowMs: 200,
  keyQuietMs: 500,
  typingHoldMs: 400,
  mouseIdleMs: 1200,
  regrabCooldownMs: 400,
  maxQueueAgeMs: 600,
  minSwitchGapMs: 300,
  labelDownTag: 'd',
  mouseBoxWhenIdle: true,
  boxPaddingPx: 7,
  confidenceRefreshMs: 1000 / 15,
  handBreathingPeriodMs: 4000,
  lineDash: [2, 4],
} as const;

type WorkspaceEffectOptions = {
  overlay: HTMLCanvasElement;
  desk: HTMLCanvasElement;
  deskHost: HTMLElement;
  wheelHost: HTMLElement;
  eyeHost: HTMLElement;
  themeRoot: HTMLElement;
};

type Point = { x: number; y: number };
type SpringPoint = Point & { vx: number; vy: number; initialized: boolean };
type SpringValue = { value: number; velocity: number; initialized: boolean };
type Palette = { bg: string; ink: string; dim: string; accent: string; line: string; chrome: string };
type HandSide = 'left' | 'right';
type HandState = 'KEYS' | 'TO_MOUSE' | 'MOUSE' | 'TO_KEYS';
type KeyStrike = { code: string; hand: HandSide; startedAt: number };
type KeyPress = { startedAt: number; until: number };
type Box = { left: number; top: number; right: number; bottom: number };
type Geometry = { width: number; height: number; dpr: number };

type KeyboardKey = { code: string; label: string; row: number; col: number };

const KEY_ROWS: KeyboardKey[][] = [
  [
    { code: 'Escape', label: 'esc', row: 0, col: 0 },
    ...'1234567890-='.split('').map((label, index) => ({
      code: index < 9 ? `Digit${index + 1}` : index === 9 ? 'Digit0' : index === 10 ? 'Minus' : 'Equal',
      label,
      row: 0,
      col: index + 1,
    })),
    { code: 'Backspace', label: '←', row: 0, col: 13 },
  ],
  'qwertyuiop'.split('').map((label, index) => ({
    code: `Key${label.toUpperCase()}`, label, row: 1, col: index,
  })).concat([
    { code: 'BracketLeft', label: '[', row: 1, col: 10 },
    { code: 'BracketRight', label: ']', row: 1, col: 11 },
    { code: 'Backslash', label: '\\', row: 1, col: 12 },
  ]),
  'asdfghjkl'.split('').map((label, index) => ({
    code: `Key${label.toUpperCase()}`, label, row: 2, col: index,
  })).concat([
    { code: 'Semicolon', label: ';', row: 2, col: 9 },
    { code: 'Quote', label: "'", row: 2, col: 10 },
    { code: 'Enter', label: '↵', row: 2, col: 11 },
  ]),
  [
    { code: 'ShiftLeft', label: '↑', row: 3, col: 0 },
    ...'zxcvbnm'.split('').map((label, index) => ({
      code: `Key${label.toUpperCase()}`, label, row: 3, col: index + 1,
    })),
    { code: 'Comma', label: ',', row: 3, col: 8 },
    { code: 'Period', label: '.', row: 3, col: 9 },
    { code: 'Slash', label: '/', row: 3, col: 10 },
    { code: 'ShiftRight', label: '↑', row: 3, col: 11 },
  ],
];

const REST_LANDMARKS: Point[] = [
  { x: 0, y: 0 },
  { x: 0.38, y: -0.22 }, { x: 0.58, y: -0.42 }, { x: 0.7, y: -0.6 }, { x: 0.78, y: -0.76 },
  { x: 0.3, y: -0.95 }, { x: 0.32, y: -1.32 }, { x: 0.33, y: -1.54 }, { x: 0.34, y: -1.74 },
  { x: 0.1, y: -1 }, { x: 0.1, y: -1.4 }, { x: 0.1, y: -1.64 }, { x: 0.1, y: -1.86 },
  { x: -0.1, y: -0.96 }, { x: -0.12, y: -1.32 }, { x: -0.13, y: -1.54 }, { x: -0.14, y: -1.72 },
  { x: -0.3, y: -0.88 }, { x: -0.34, y: -1.16 }, { x: -0.36, y: -1.34 }, { x: -0.38, y: -1.48 },
];

const DIGITS = [
  { root: 0, joints: [1, 2, 3, 4] },
  { root: 5, joints: [6, 7, 8] },
  { root: 9, joints: [10, 11, 12] },
  { root: 13, joints: [14, 15, 16] },
  { root: 17, joints: [18, 19, 20] },
];

const MOUSE_GRIP_OFFSETS = [
  { x: -0.48, y: 0.04 },
  { x: -0.17, y: -0.18 },
  { x: 0.17, y: -0.18 },
  { x: 0.43, y: 0.02 },
  { x: 0.42, y: 0.28 },
];

const BONES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [17, 0],
];

const FINGER_HAND_CODES: Record<HandSide, Record<number, string[]>> = {
  left: {
    1: ['Digit4', 'Digit5', 'KeyR', 'KeyT', 'KeyF', 'KeyG', 'KeyV', 'KeyB'],
    2: ['Digit3', 'KeyE', 'KeyD', 'KeyC'],
    3: ['Digit2', 'KeyW', 'KeyS', 'KeyX'],
    4: ['Backquote', 'Digit1', 'Tab', 'KeyQ', 'CapsLock', 'KeyA', 'ShiftLeft', 'KeyZ'],
  },
  right: {
    1: ['Digit6', 'Digit7', 'KeyY', 'KeyU', 'KeyH', 'KeyJ', 'KeyN', 'KeyM'],
    2: ['Digit8', 'KeyI', 'KeyK', 'Comma'],
    3: ['Digit9', 'KeyO', 'KeyL', 'Period'],
    4: ['Digit0', 'Minus', 'Equal', 'Backspace', 'KeyP', 'BracketLeft', 'BracketRight',
      'Backslash', 'Semicolon', 'Quote', 'Enter', 'Slash', 'ShiftRight'],
  },
};

export function createWorkspaceEffects(options: WorkspaceEffectOptions) {
  const { overlay, desk, deskHost, wheelHost, eyeHost, themeRoot } = options;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mouseButtons = new Set<number>();
  const mouseClickAt = new Map<number, number>();
  const keyStrikes: KeyStrike[] = [];
  const keyPresses = new Map<string, KeyPress>();
  const queuedStrikes: Array<{ code: string; at: number; queuedAt: number }> = [];
  const hands: Record<HandSide, {
    wrist: SpringPoint;
    flex: SpringValue[];
    mouseTips: SpringPoint[];
    box: { left: SpringValue; top: SpringValue; right: SpringValue; bottom: SpringValue };
    confidence: number;
    confidenceAt: number;
    yaw: number;
    labelPulseUntil: number;
    twitchDigit: number;
    twitchStartedAt: number;
    twitchEndsAt: number;
    nextTwitchAt: number;
  }> = {
    left: createHand(),
    right: createHand(),
  };
  let renderedLandmarks: Record<HandSide, Point[]> = { left: [], right: [] };

  let palette = readPalette();
  let frame = 0;
  let previousFrameAt = 0;
  let elapsed = 0;
  let destroyed = false;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let overlaySize: Geometry = { width: 0, height: 0, dpr: 1 };
  let deskSize: Geometry = { width: 0, height: 0, dpr: 1 };
  let cursorPosition: Point | null = null;
  let lastMoveAt = -Infinity;
  let lastKeyAt = -Infinity;
  let lastSwitchAt = -Infinity;
  let burstStart = -Infinity;
  let burstDistance = 0;
  let lastPointer: Point | null = null;
  let autoTyping = false;
  let autoTypingUntil = -Infinity;
  let upcomingText = '';
  let lastQueueFlushAt = -Infinity;
  let rightState: HandState = 'KEYS';
  let handTransition: { from: Point; to: Point; startedAt: number; duration: number } | null = null;
  let mouseTarget: Point | null = null;
  const mousePosition: SpringPoint = { x: 0, y: 0, vx: 0, vy: 0, initialized: false };
  let mouseConfidence = 0.336;
  let mouseOverlapConfidence = 0.7848649;
  let mouseConfidenceAt = -Infinity;
  let lastWheelAt = -Infinity;
  let debug = new URLSearchParams(window.location.search).get('debug') === 'desk';
  let debugInfo = { burst: 0, queue: 0, autoTyping: false };

  function createHand() {
    const springBox = () => ({ left: valueSpring(), top: valueSpring(), right: valueSpring(), bottom: valueSpring() });
    return {
      wrist: { x: 0, y: 0, vx: 0, vy: 0, initialized: false },
      flex: Array.from({ length: 5 }, valueSpring),
      mouseTips: Array.from({ length: 5 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, initialized: false })),
      box: springBox(),
      confidence: 0.88,
      confidenceAt: -Infinity,
      yaw: 0,
      labelPulseUntil: 0,
      twitchDigit: -1,
      twitchStartedAt: -Infinity,
      twitchEndsAt: -Infinity,
      nextTwitchAt: 0,
    };
  }

  function valueSpring(): SpringValue {
    return { value: 0, velocity: 0, initialized: false };
  }

  function readPalette(): Palette {
    const styles = window.getComputedStyle(themeRoot);
    const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    return {
      bg: read('--bg', '#0c0b0d'),
      ink: read('--ink', '#d8d4b4'),
      dim: read('--dim', '#77735f'),
      accent: read('--accent', '#d97a5f'),
      line: read('--line', '#171716'),
      chrome: read('--chrome', '#a8a385'),
    };
  }

  function spring(x: number, velocity: number, target: number, omega: number, dt: number): [number, number] {
    const e = Math.exp(-omega * dt);
    const d = x - target;
    const t = (velocity + omega * d) * dt;
    return [target + (d + t) * e, (velocity - omega * t) * e];
  }

  function followPoint(position: SpringPoint, target: Point, omega: number, dt: number): Point {
    if (!position.initialized) {
      position.x = target.x;
      position.y = target.y;
      position.initialized = true;
      return position;
    }
    if (media.matches) {
      position.x = target.x;
      position.y = target.y;
      position.vx = 0;
      position.vy = 0;
    } else {
      [position.x, position.vx] = spring(position.x, position.vx, target.x, omega, dt);
      [position.y, position.vy] = spring(position.y, position.vy, target.y, omega, dt);
    }
    return position;
  }

  function followValue(value: SpringValue, target: number, omega: number, dt: number): number {
    if (!value.initialized) {
      value.value = target;
      value.initialized = true;
      return target;
    }
    if (media.matches) {
      value.value = target;
      value.velocity = 0;
    } else {
      [value.value, value.velocity] = spring(value.value, value.velocity, target, omega, dt);
    }
    return value.value;
  }

  function sizeCanvas(canvas: HTMLCanvasElement, host: HTMLElement): Geometry {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, WORKSPACE_EFFECTS_CONFIG.maxDevicePixelRatio);
    const width = Math.max(0, rect.width);
    const height = Math.max(0, rect.height);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    return { width, height, dpr };
  }

  function resizeCanvases() {
    overlaySize = sizeCanvas(overlay, overlay);
    deskSize = sizeCanvas(desk, deskHost);
    requestFrame();
  }

  function requestFrame() {
    if (!destroyed && pageVisible && visible && !frame) {
      frame = window.requestAnimationFrame(draw);
    }
  }

  function canvasContext(canvas: HTMLCanvasElement, size: Geometry): CanvasRenderingContext2D | null {
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    return context;
  }

  function draw(timestamp: number) {
    frame = 0;
    if (destroyed || !pageVisible || !visible) return;
    const dt = previousFrameAt ? Math.min(timestamp - previousFrameAt, WORKSPACE_EFFECTS_CONFIG.maxDeltaMs) / 1000 : 0;
    previousFrameAt = timestamp;
    elapsed += dt;
    if (timestamp - burstStart > WORKSPACE_EFFECTS_CONFIG.grabWindowMs) burstDistance = 0;
    palette = readPalette();
    drawTrackingLine(timestamp);
    if (window.innerWidth > 700 && deskSize.width > 0 && deskSize.height > 0) {
      drawDesk(timestamp, dt);
    }
    const animating =
      !media.matches ||
      keyStrikes.length > 0 ||
      queuedStrikes.length > 0 ||
      mouseButtons.size > 0 ||
      rightState === 'TO_MOUSE' ||
      rightState === 'TO_KEYS' ||
      Math.abs(hands.left.wrist.vx) + Math.abs(hands.left.wrist.vy) > 0.1 ||
      Math.abs(hands.right.wrist.vx) + Math.abs(hands.right.wrist.vy) > 0.1;
    if (window.innerWidth > 700 && animating) frame = window.requestAnimationFrame(draw);
  }

  function drawTrackingLine(timestamp: number) {
    const context = canvasContext(overlay, overlaySize);
    if (!context || media.matches || window.innerWidth <= 700) return;
    const pupil = eyeHost.querySelector<HTMLElement>('.eye-pupil');
    const bounds = (pupil ?? eyeHost).getBoundingClientRect();
    const to = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    const wheelBounds = wheelHost.getBoundingClientRect();
    const from = cursorPosition ?? { x: wheelBounds.right, y: wheelBounds.top + wheelBounds.height * 0.42 };
    context.strokeStyle = palette.dim;
    context.fillStyle = palette.dim;
    context.globalAlpha = 0.52;
    context.lineWidth = 1;
    context.setLineDash([...WORKSPACE_EFFECTS_CONFIG.lineDash]);
    context.lineDashOffset = media.matches ? 0 : -(timestamp / 180) % 6;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.setLineDash([]);
    context.strokeRect(from.x - 5, from.y - 5, 10, 10);
    context.beginPath();
    context.arc(to.x, to.y, 5, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
  }

  function geometry() {
    const { width, height } = deskSize;
    const kx = Math.min(
      width * WORKSPACE_EFFECTS_CONFIG.keyPitchWidthRatio / WORKSPACE_EFFECTS_CONFIG.keyboardSidePaddingKeys,
      Math.max(4, (height - 30) / (5 * WORKSPACE_EFFECTS_CONFIG.keyPitchHeightRatio)),
    );
    const scaleKx = Math.min(
      width * WORKSPACE_EFFECTS_CONFIG.handScaleWidthRatio / WORKSPACE_EFFECTS_CONFIG.keyboardSidePaddingKeys,
      Math.max(4, (height - 30) / (5 * WORKSPACE_EFFECTS_CONFIG.keyPitchHeightRatio)),
    );
    const ky = WORKSPACE_EFFECTS_CONFIG.keyPitchHeightRatio * kx;
    const keyboardWidth = WORKSPACE_EFFECTS_CONFIG.keyboardSidePaddingKeys * kx;
    const keyboardLeft = width * 0.44 - keyboardWidth / 2;
    const keyboardTop = Math.max(4, (height - 5 * ky) * 0.12);
    const rowOffset = [0, 0.5, 0.75, 1.25];
    const mouse = { x: width * 0.76, y: height * 0.53 };
    return { kx, ky, scaleKx, palm: WORKSPACE_EFFECTS_CONFIG.palmUnits * scaleKx, keyboardLeft, keyboardTop, keyboardWidth, rowOffset, mouse };
  }

  function keyCenter(code: string, layout = geometry()): Point | null {
    if (code === 'Space') {
      const b = KEY_ROWS[3].find((key) => key.label === 'b');
      return b ? {
        x: layout.keyboardLeft + (b.col + layout.rowOffset[3] + 0.5) * layout.kx,
        y: layout.keyboardTop + 4 * layout.ky,
      } : null;
    }
    const hiddenKeyPositions: Record<string, { row: number; col: number }> = {
      Backquote: { row: 0, col: 0 },
      Tab: { row: 1, col: 0 },
      CapsLock: { row: 2, col: 0 },
    };
    const hidden = hiddenKeyPositions[code];
    if (hidden) {
      return {
        x: layout.keyboardLeft + (hidden.col + layout.rowOffset[hidden.row] + 0.5) * layout.kx,
        y: layout.keyboardTop + (hidden.row + 0.5) * layout.ky,
      };
    }
    const key = KEY_ROWS.flat().find((item) => item.code === code);
    if (!key) return null;
    return {
      x: layout.keyboardLeft + (key.col + layout.rowOffset[key.row] + 0.5) * layout.kx,
      y: layout.keyboardTop + (key.row + 0.5) * layout.ky,
    };
  }

  function fingerHand(code: string): HandSide {
    for (const side of ['left', 'right'] as const) {
      if (Object.values(FINGER_HAND_CODES[side]).some((codes) => codes.includes(code))) return side;
    }
    return 'left';
  }

  function digitForCode(code: string, hand: HandSide): number {
    if (code === 'Space') return 0;
    for (const [digit, codes] of Object.entries(FINGER_HAND_CODES[hand])) {
      if (codes.includes(code)) return Number(digit);
    }
    return 1;
  }

  function isKnownKey(code: string) {
    return code === 'Space' || ['Backquote', 'Tab', 'CapsLock'].includes(code) ||
      KEY_ROWS.flat().some((key) => key.code === code) ||
      Object.values(FINGER_HAND_CODES).some((fingers) => Object.values(fingers).some((codes) => codes.includes(code)));
  }

  function handHomeKeys(side: HandSide) {
    return side === 'left'
      ? ['Space', 'KeyF', 'KeyD', 'KeyS', 'KeyA']
      : ['Space', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
  }

  function restLocalPoint(index: number, side: HandSide, palm: number): Point {
    const point = REST_LANDMARKS[index];
    const mirror = side === 'right' ? -1 : 1;
    return { x: point.x * palm * mirror, y: point.y * palm };
  }

  function restWrist(side: HandSide, layout = geometry()): Point {
    const homes = handHomeKeys(side);
    let x = 0;
    let y = 0;
    let count = 0;
    for (let digit = 0; digit < homes.length; digit += 1) {
      const target = keyCenter(homes[digit], layout);
      if (!target) continue;
      const endpoint = restLocalPoint(DIGITS[digit].joints.at(-1)!, side, layout.palm);
      x += target.x - endpoint.x;
      y += target.y - endpoint.y;
      count += 1;
    }
    return count ? { x: x / count, y: y / count } : { x: layout.keyboardLeft, y: layout.keyboardTop };
  }

  function transitionHand(state: HandState, now: number, target: Point, urgent = false) {
    if (state === rightState || (!urgent && now - lastSwitchAt < WORKSPACE_EFFECTS_CONFIG.minSwitchGapMs)) return;
    if (media.matches) {
      hands.right.wrist.x = target.x;
      hands.right.wrist.y = target.y;
      hands.right.wrist.vx = 0;
      hands.right.wrist.vy = 0;
      hands.right.wrist.initialized = true;
      handTransition = null;
      rightState = state;
      lastSwitchAt = now;
      return;
    }
    const distance = Math.hypot(target.x - hands.right.wrist.x, target.y - hands.right.wrist.y);
    const kx = geometry().kx;
    const duration = Math.max(
      WORKSPACE_EFFECTS_CONFIG.travelMinMs,
      Math.min(
        WORKSPACE_EFFECTS_CONFIG.travelMaxMs,
        WORKSPACE_EFFECTS_CONFIG.travelBaseMs +
          WORKSPACE_EFFECTS_CONFIG.travelLogScaleMs * Math.log2(1 + distance / kx),
      ),
    );
    handTransition = { from: { x: hands.right.wrist.x, y: hands.right.wrist.y }, to: target, startedAt: now, duration };
    rightState = state;
    lastSwitchAt = now;
    if (debug) console.info(`[desk] ${state === 'TO_MOUSE' ? 'KEYS -> TO_MOUSE' : state === 'TO_KEYS' ? 'MOUSE -> TO_KEYS' : `-> ${state}`}`);
  }

  function transitionTarget(now: number, fallback: Point): Point {
    if (!handTransition) return fallback;
    const t = Math.max(0, Math.min(1, (now - handTransition.startedAt) / handTransition.duration));
    const smooth = 10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5;
    const dx = handTransition.to.x - handTransition.from.x;
    const dy = handTransition.to.y - handTransition.from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const arc = WORKSPACE_EFFECTS_CONFIG.travelArcRatio * distance * Math.sin(Math.PI * t);
    const point = {
      x: handTransition.from.x + dx * smooth - dy / distance * arc,
      y: handTransition.from.y + dy * smooth + dx / distance * arc,
    };
    if (t >= 1) handTransition = null;
    return point;
  }

  function drawDesk(timestamp: number, dt: number) {
    const context = canvasContext(desk, deskSize);
    if (!context) return;
    const layout = geometry();
    const homeLeft = restWrist('left', layout);
    const homeRight = restWrist('right', layout);
    if (!mouseTarget) mouseTarget = { ...layout.mouse };
    followPoint(mousePosition, mouseTarget, WORKSPACE_EFFECTS_CONFIG.mouseOmega, dt);
    const middlePoint = mousePosition;
    if (lastMoveAt > -Infinity) {
      const idle = timestamp - lastMoveAt;
      const typing = autoTyping || timestamp < autoTypingUntil || timestamp - lastKeyAt < WORKSPACE_EFFECTS_CONFIG.typingHoldMs;
      if ((rightState === 'MOUSE' || rightState === 'TO_MOUSE') && typing) {
        transitionHand('TO_KEYS', timestamp, homeRight);
      } else if (rightState === 'MOUSE' && idle > WORKSPACE_EFFECTS_CONFIG.mouseIdleMs) {
        transitionHand('TO_KEYS', timestamp, homeRight);
      } else if (
        rightState === 'KEYS' &&
        !typing &&
        timestamp - lastKeyAt > WORKSPACE_EFFECTS_CONFIG.keyQuietMs &&
        timestamp - lastSwitchAt > WORKSPACE_EFFECTS_CONFIG.regrabCooldownMs &&
        burstDistance >= WORKSPACE_EFFECTS_CONFIG.grabDistancePx &&
        timestamp - burstStart <= WORKSPACE_EFFECTS_CONFIG.grabWindowMs
      ) {
        transitionHand('TO_MOUSE', timestamp, {
          x: middlePoint.x + middlePoint.vx * WORKSPACE_EFFECTS_CONFIG.mouseHandLeadMs / 1000 +
            layout.palm * WORKSPACE_EFFECTS_CONFIG.mouseWristXOffsetPalmUnits,
          y: Math.min(
            deskSize.height - layout.scaleKx * 0.3,
            middlePoint.y + middlePoint.vy * WORKSPACE_EFFECTS_CONFIG.mouseHandLeadMs / 1000 +
              layout.palm * WORKSPACE_EFFECTS_CONFIG.mouseWristYOffsetPalmUnits,
          ),
        });
      }
    }

    const rightFallback = rightState === 'MOUSE' || rightState === 'TO_MOUSE'
      ? {
        x: middlePoint.x + middlePoint.vx * WORKSPACE_EFFECTS_CONFIG.mouseHandLeadMs / 1000 +
          layout.palm * WORKSPACE_EFFECTS_CONFIG.mouseWristXOffsetPalmUnits,
        y: Math.min(
          deskSize.height - layout.scaleKx * 0.3,
          middlePoint.y + middlePoint.vy * WORKSPACE_EFFECTS_CONFIG.mouseHandLeadMs / 1000 +
            layout.palm * WORKSPACE_EFFECTS_CONFIG.mouseWristYOffsetPalmUnits,
        ),
      }
      : homeRight;
    if (rightState === 'TO_MOUSE' && handTransition) handTransition.to = { ...rightFallback };
    const rightTarget = transitionTarget(timestamp, rightFallback);
    if (rightState === 'TO_MOUSE' && !handTransition) rightState = 'MOUSE';
    if (rightState === 'TO_KEYS' && !handTransition) rightState = 'KEYS';
    const activeStrikes = keyStrikes.filter((strike) => timestamp - strike.startedAt < 180);
    keyStrikes.splice(0, keyStrikes.length, ...activeStrikes);
    flushQueuedStrikes(timestamp);

    const leftTargetKey = [...keyStrikes].reverse().find((strike) => strike.hand === 'left');
    const rightTargetKey = rightState === 'KEYS' ? [...keyStrikes].reverse().find((strike) => strike.hand === 'right') : undefined;
    const leftWristTarget = homeLeft;
    const rightWristTarget = rightState === 'KEYS' ? homeRight : rightTarget;
    followPoint(hands.left.wrist, leftWristTarget, WORKSPACE_EFFECTS_CONFIG.wristOmega, dt);
    if (rightState === 'TO_MOUSE' || rightState === 'TO_KEYS') {
      hands.right.wrist.vx = dt > 0 ? (rightWristTarget.x - hands.right.wrist.x) / dt : 0;
      hands.right.wrist.vy = dt > 0 ? (rightWristTarget.y - hands.right.wrist.y) / dt : 0;
      hands.right.wrist.x = rightWristTarget.x;
      hands.right.wrist.y = rightWristTarget.y;
    } else {
      followPoint(hands.right.wrist, rightWristTarget, rightState === 'KEYS' ? WORKSPACE_EFFECTS_CONFIG.wristOmega : WORKSPACE_EFFECTS_CONFIG.travelOmega, dt);
    }
    hands.left.yaw = yawFromVelocity(hands.left.wrist.vx, layout.scaleKx);
    hands.right.yaw = rightState === 'MOUSE' ? 0 : yawFromVelocity(hands.right.wrist.vx, layout.scaleKx);
    if (media.matches) {
      hands.left.wrist.y = leftWristTarget.y;
      hands.right.wrist.y = rightWristTarget.y;
      hands.left.wrist.vx = hands.left.wrist.vy = 0;
      hands.right.wrist.vx = hands.right.wrist.vy = 0;
      hands.left.yaw = hands.right.yaw = 0;
    }

    for (const [code, press] of keyPresses) if (timestamp >= press.until) keyPresses.delete(code);
    const leftPoints = makeLandmarks('left', hands.left, timestamp, layout, leftTargetKey, dt);
    const rightOnMouse = rightState === 'MOUSE' || rightState === 'TO_MOUSE';
    const rightPoints = makeLandmarks('right', hands.right, timestamp, layout, rightTargetKey, dt);
    renderedLandmarks = { left: leftPoints, right: rightPoints };
    const pressed = new Set([...keyPresses.entries()].filter(([, press]) => timestamp < press.until).map(([code]) => code));
    const fingertips = [...[4, 8, 12, 16, 20].map((index) => leftPoints[index]),
      ...[4, 8, 12, 16, 20].map((index) => rightPoints[index])];
    drawKeyboard(context, layout, fingertips, pressed);
    const mouseDrawingPoint = {
      x: middlePoint.x,
      y: middlePoint.y + (mouseButtons.size ? WORKSPACE_EFFECTS_CONFIG.mouseClickDipPx : 0),
    };
    drawMouse(context, mouseDrawingPoint, layout, timestamp - lastWheelAt < 180, rightOnMouse, timestamp);
    drawHand(context, 'left', leftPoints, hands.left, timestamp, layout, dt);
    if (rightOnMouse) {
      drawHand(context, 'right', rightPoints, hands.right, timestamp, layout, dt, mouseBounds(mouseDrawingPoint, layout));
    } else {
      drawHand(context, 'right', rightPoints, hands.right, timestamp, layout, dt);
    }
    drawMouseClickFeedback(context, mouseDrawingPoint, layout, timestamp);
    if (debug) drawDebug(context, timestamp);
  }

  function yawFromVelocity(vx: number, kx: number) {
    return Math.max(-1, Math.min(1, vx / (WORKSPACE_EFFECTS_CONFIG.yawVelocityScale * kx))) *
      WORKSPACE_EFFECTS_CONFIG.yawMaxDegrees * Math.PI / 180;
  }

  function lookAheadCode(side: HandSide): string | null {
    for (const character of [...upcomingText].slice(0, 3)) {
      const code = codeForCharacter(character);
      if (code && (code === 'Space' || fingerHand(code) === side)) return code;
    }
    return null;
  }

  function codeForCharacter(character: string): string | null {
    if (/[a-z]/i.test(character)) return `Key${character.toUpperCase()}`;
    if (/[0-9]/.test(character)) return `Digit${character}`;
    const symbols: Record<string, string> = {
      ' ': 'Space', '\n': 'Enter', '.': 'Period', ',': 'Comma', ':': 'Semicolon', ';': 'Semicolon',
      '/': 'Slash', '?': 'Slash', '-': 'Minus', '_': 'Minus', '=': 'Equal', '+': 'Equal',
      '\'': 'Quote', '"': 'Quote', '`': 'Backquote', '~': 'Backquote', '[': 'BracketLeft',
      '{': 'BracketLeft', ']': 'BracketRight', '}': 'BracketRight', '\\': 'Backslash',
      '|': 'Backslash', '>': 'Period', '<': 'Comma',
      '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
      '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
    };
    return symbols[character] ?? null;
  }

  function makeLandmarks(
    side: HandSide,
    hand: typeof hands.left,
    timestamp: number,
    layout: ReturnType<typeof geometry>,
    strike?: KeyStrike,
    dt = 0,
  ): Point[] {
    const palm = layout.palm;
    const mirror = side === 'right' ? -1 : 1;
    const rightOnMouse = side === 'right' && (rightState === 'MOUSE' || rightState === 'TO_MOUSE');
    if (!media.matches && !rightOnMouse && timestamp >= hand.nextTwitchAt) {
      hand.twitchDigit = 1 + Math.floor(Math.random() * 4);
      hand.twitchStartedAt = timestamp;
      hand.twitchEndsAt = timestamp + 250;
      hand.nextTwitchAt = timestamp + WORKSPACE_EFFECTS_CONFIG.twitchIntervalMs[0] +
        Math.random() * (WORKSPACE_EFFECTS_CONFIG.twitchIntervalMs[1] - WORKSPACE_EFFECTS_CONFIG.twitchIntervalMs[0]);
    }
    const twitch = !media.matches && timestamp < hand.twitchEndsAt
      ? WORKSPACE_EFFECTS_CONFIG.twitchAmplitude * Math.sin(Math.PI * (timestamp - hand.twitchStartedAt) / (hand.twitchEndsAt - hand.twitchStartedAt))
      : 0;
    const breathing = media.matches || rightOnMouse ? 0 : Math.sin(elapsed / (WORKSPACE_EFFECTS_CONFIG.handBreathingPeriodMs / 1000) * Math.PI * 2) * WORKSPACE_EFFECTS_CONFIG.breathingAmplitudePx;
    const wrist = { x: hand.wrist.x, y: hand.wrist.y + breathing };
    const local = REST_LANDMARKS.map((point) => ({ x: point.x * palm * mirror, y: point.y * palm }));
    const strikeDigit = strike ? digitForCode(strike.code, side) : -1;
    const strikeAge = strike ? timestamp - strike.startedAt : Infinity;
    const upcomingCode = autoTyping || timestamp < autoTypingUntil ? lookAheadCode(side) : null;
    const upcomingDigit = upcomingCode ? digitForCode(upcomingCode, side) : -1;
    const fingertipTargets: Array<Point | null> = [];
    for (let digit = 0; digit < DIGITS.length; digit += 1) {
      const rig = DIGITS[digit];
      const root = local[rig.root];
      const tip = local[rig.joints.at(-1)!];
      const mouseAim = rightOnMouse && (digit === 1 || digit === 2);
      const mouseGrip = rightOnMouse;
      const mouseWidth = WORKSPACE_EFFECTS_CONFIG.mouseWidthKeys * layout.scaleKx;
      const mouseHeight = WORKSPACE_EFFECTS_CONFIG.mouseHeightKeys * layout.scaleKx;
      const mouseGripOffset = MOUSE_GRIP_OFFSETS[digit];
      const target = mouseGrip
        ? followPoint(hand.mouseTips[digit], {
          x: mousePosition.x + mouseWidth * mouseGripOffset.x +
            (mouseAim && !media.matches ? Math.sin(timestamp * 0.0018 + digit) * 0.45 : 0),
          y: mousePosition.y + mouseHeight * mouseGripOffset.y +
            (mouseAim && !media.matches ? Math.sin(timestamp * 0.0021 + digit * Math.PI) * 0.55 : 0),
        }, 24, dt)
        : keyCenter(
          digit === strikeDigit && strike
            ? strike.code
            : digit === upcomingDigit && upcomingCode
              ? upcomingCode
              : handHomeKeys(side)[digit],
          layout,
        );
      fingertipTargets[digit] = target;
      let flexTarget = 0.08;
      let angle = [6, 4, 0, -3, -8][digit] * Math.PI / 180;
      if (target) {
        const mcp = { x: wrist.x + root.x, y: wrist.y + root.y };
        let aimPoint = target;
        if (digit === strikeDigit && strikeAge < WORKSPACE_EFFECTS_CONFIG.anticipateDurationMs) {
          const dx = target.x - mcp.x;
          const dy = target.y - mcp.y;
          const distance = Math.hypot(dx, dy) || 1;
          aimPoint = {
            x: target.x - dx / distance * layout.kx * WORKSPACE_EFFECTS_CONFIG.anticipateRetractKeys,
            y: target.y - dy / distance * layout.kx * WORKSPACE_EFFECTS_CONFIG.anticipateRetractKeys,
          };
        }
        const vector = { x: aimPoint.x - mcp.x, y: aimPoint.y - mcp.y };
        const baseAngle = Math.atan2(tip.y - root.y, tip.x - root.x);
        const targetAngle = Math.atan2(vector.y, vector.x * mirror);
        angle += clampAngle(targetAngle - baseAngle, 25 * Math.PI / 180);
        const length = Math.hypot(tip.x - root.x, tip.y - root.y);
        const desired = Math.max(length * 0.55, Math.min(length, Math.hypot(vector.x, vector.y)));
        flexTarget = Math.min(1, Math.max(0, (length - desired) / (length * 0.24)));
        if (digit === strikeDigit && strike) {
          if (strikeAge < WORKSPACE_EFFECTS_CONFIG.anticipateDurationMs) flexTarget = 0;
          else if (strikeAge < WORKSPACE_EFFECTS_CONFIG.anticipateDurationMs + WORKSPACE_EFFECTS_CONFIG.strikeDurationMs) {
            flexTarget = (strikeAge - WORKSPACE_EFFECTS_CONFIG.anticipateDurationMs) / WORKSPACE_EFFECTS_CONFIG.strikeDurationMs;
          } else if (strikeAge < WORKSPACE_EFFECTS_CONFIG.anticipateDurationMs + WORKSPACE_EFFECTS_CONFIG.strikeDurationMs + WORKSPACE_EFFECTS_CONFIG.strikeHoldMs) {
            flexTarget = 1;
          } else {
            flexTarget = Math.max(0, 1 - (strikeAge - 120) / 45);
          }
        }
      } else if (mouseGrip) {
        flexTarget = digit === 0 ? 0.55 : 0.88;
      }
      if (mouseAim) {
        flexTarget = (digit === 1 ? clickAlpha(0, timestamp) : clickAlpha(2, timestamp)) > 0 ? 1 : 0.2;
        if (digit === 2 && timestamp - lastWheelAt < 180) {
          flexTarget = Math.max(flexTarget, Math.max(0, 1 - (timestamp - lastWheelAt) / 180));
        }
      }
      if (mouseGrip && digit === 0) flexTarget = 0.55;
      if (strike && strikeAge >= 25 && strikeAge < 120 && Math.abs(digit - strikeDigit) === 1) {
        flexTarget = Math.max(flexTarget, WORKSPACE_EFFECTS_CONFIG.sympatheticFlexRatio *
          Math.min(1, (strikeAge - 25) / 55));
      }
      if (!rightOnMouse && digit === hand.twitchDigit) flexTarget += twitch;
      const flex = followValue(hand.flex[digit], flexTarget, WORKSPACE_EFFECTS_CONFIG.fingerOmega, dt);
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const mouseCurl = mouseGrip && !mouseAim && digit > 0;
      for (const index of rig.joints) {
        const original = REST_LANDMARKS[index];
        const base = REST_LANDMARKS[rig.root];
        const dx = (original.x - base.x) * palm;
        const dy = (original.y - base.y) * palm;
        const rotated = { x: dx * cosine - dy * sine, y: dx * sine + dy * cosine };
        const progression = rig.joints.indexOf(index);
        const shortening = 1 - flex * (mouseCurl
          ? [0.16, 0.36, 0.52][Math.min(2, progression)]
          : [0.1, 0.17, 0.24][Math.min(2, progression)]);
        const curlProgress = mouseCurl ? (progression + 1) / rig.joints.length : 0;
        const tremor = media.matches || rightOnMouse ? 0 : (Math.sin(elapsed * 5.1 + index * 1.7) + Math.sin(elapsed * 7.2 + index * 2.3)) * 0.25;
        local[index] = {
          x: root.x + rotated.x * shortening * mirror - root.x * curlProgress * 0.26 + tremor,
          y: root.y + rotated.y * shortening + palm * curlProgress * 0.42 + tremor,
        };
      }
    }
    const cosine = Math.cos(hand.yaw);
    const sine = Math.sin(hand.yaw);
    const points = local.map((point, index) => ({
      x: wrist.x + point.x * cosine - point.y * sine,
      y: wrist.y + point.x * sine + point.y * cosine +
        (media.matches || rightOnMouse ? 0 : Math.sin(elapsed * 5 + index * 0.7) * 0.18),
    }));
    DIGITS.forEach((rig, digit) => {
      const target = fingertipTargets[digit];
      if (!target) return;
      const tipIndex = rig.joints.at(-1)!;
      const correction = {
        x: target.x - points[tipIndex].x,
        y: target.y - points[tipIndex].y,
      };
      rig.joints.forEach((index, joint) => {
        const reach = (joint + 1) / rig.joints.length;
        points[index].x += correction.x * reach;
        points[index].y += correction.y * reach;
      });
    });
    return points;
  }

  function clampAngle(value: number, limit: number) {
    return Math.max(-limit, Math.min(limit, value));
  }

  function boundsOf(points: Point[], padding = 0): Box {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
      left: Math.min(...xs) - padding,
      top: Math.min(...ys) - padding,
      right: Math.max(...xs) + padding,
      bottom: Math.max(...ys) + padding,
    };
  }

  function drawKeyboard(
    context: CanvasRenderingContext2D,
    layout: ReturnType<typeof geometry>,
    fingertips: Point[],
    pressed: Set<string>,
  ) {
    context.save();
    context.font = '12px "IBM Plex Mono", monospace';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    KEY_ROWS.forEach((row) => row.forEach((key) => {
      const point = keyCenter(key.code, layout);
      if (!point || point.x < 0 || point.x > deskSize.width) return;
      const underFinger = fingertips.some((finger) =>
        Math.hypot(finger.x - point.x, finger.y - point.y) < layout.kx * WORKSPACE_EFFECTS_CONFIG.keyOcclusionRadiusKeys,
      );
      if (underFinger && !pressed.has(key.code)) return;
      context.globalAlpha = WORKSPACE_EFFECTS_CONFIG.keyLabelAlpha;
      context.fillStyle = pressed.has(key.code) ? palette.accent : palette.dim;
      context.fillText(key.label, point.x, point.y);
    }));
    const b = keyCenter('KeyB', layout);
    if (b) {
      context.globalAlpha = 0.6;
      context.strokeStyle = palette.dim;
      context.lineWidth = 1;
      const center = b.x;
      const y = layout.keyboardTop + 4.5 * layout.ky;
      context.beginPath();
      context.moveTo(center - 2.85 * layout.kx, y + 0.5);
      context.lineTo(center + 2.85 * layout.kx, y + 0.5);
      context.stroke();
    }
    context.restore();
  }

  function drawHand(
    context: CanvasRenderingContext2D,
    side: HandSide,
    points: Point[],
    hand: typeof hands.left,
    timestamp: number,
    layout: ReturnType<typeof geometry>,
    dt: number,
    mouseBox?: Box,
  ) {
    const box = boundsOf(mouseBox ? [...points, ...boxCorners(mouseBox)] : points, WORKSPACE_EFFECTS_CONFIG.boxPaddingPx);
    const rect = smoothBox(hand, box, timestamp, dt);
    const active = keyStrikes.some((strike) => strike.hand === side && timestamp - strike.startedAt < 80);
    const alpha = timestamp < hand.labelPulseUntil || active ? 1 : WORKSPACE_EFFECTS_CONFIG.handBoxAlpha;
    context.save();
    context.strokeStyle = palette.ink;
    context.fillStyle = palette.ink;
    context.globalAlpha = alpha;
    context.lineWidth = 1;
    context.strokeRect(Math.round(rect.left) + 0.5, Math.round(rect.top) + 0.5, rect.right - rect.left, rect.bottom - rect.top);
    context.globalAlpha = WORKSPACE_EFFECTS_CONFIG.boneAlpha;
    for (const [start, end] of BONES) {
      context.beginPath();
      context.moveTo(points[start].x, points[start].y);
      context.lineTo(points[end].x, points[end].y);
      context.stroke();
    }
    context.globalAlpha = 0.9;
    for (let index = 0; index < points.length; index += 1) {
      context.beginPath();
      context.arc(points[index].x, points[index].y,
        [4, 8, 12, 16, 20].includes(index) ? WORKSPACE_EFFECTS_CONFIG.fingertipRadiusPx : WORKSPACE_EFFECTS_CONFIG.jointRadiusPx,
        0, Math.PI * 2);
      context.fill();
    }
    updateConfidence(hand, timestamp);
    const tag = keyStrikes.some((strike) => strike.hand === side && timestamp - strike.startedAt < 100)
      ? WORKSPACE_EFFECTS_CONFIG.labelDownTag
      : 'u';
    context.globalAlpha = 0.9;
    context.fillStyle = palette.dim;
    context.font = '11px "IBM Plex Mono", monospace';
    context.textBaseline = 'alphabetic';
    if (side === 'left') {
      context.textAlign = 'left';
      context.fillText(`['hand0:${tag}'] ${hand.confidence.toFixed(WORKSPACE_EFFECTS_CONFIG.labelDigits)}`, rect.left, rect.top - 18);
    } else {
      context.textAlign = 'right';
      context.fillText(`['hand1:${tag}'] ${hand.confidence.toFixed(WORKSPACE_EFFECTS_CONFIG.labelDigits)}`, rect.right, rect.top - 6);
    }
    context.restore();
  }

  function smoothBox(hand: typeof hands.left, target: Box, timestamp: number, dt: number): Box {
    const result = {} as Box;
    for (const edge of ['left', 'top', 'right', 'bottom'] as const) {
      result[edge] = followValue(hand.box[edge], target[edge], WORKSPACE_EFFECTS_CONFIG.boxOmega, dt);
    }
    if (media.matches) {
      for (const edge of ['left', 'top', 'right', 'bottom'] as const) {
        hand.box[edge].value = target[edge];
        hand.box[edge].velocity = 0;
        hand.box[edge].initialized = true;
      }
    }
    const jitter = media.matches ? 0 : Math.sin(Math.floor(timestamp / WORKSPACE_EFFECTS_CONFIG.boxJitterIntervalMs) * 2.4) *
      WORKSPACE_EFFECTS_CONFIG.boxJitterPx;
    result.left += jitter;
    result.right += jitter;
    return result;
  }

  function updateConfidence(hand: typeof hands.left, timestamp: number) {
    if (timestamp - hand.confidenceAt < WORKSPACE_EFFECTS_CONFIG.confidenceRefreshMs) return;
    const speed = Math.hypot(hand.wrist.vx, hand.wrist.vy) * 1000;
    const noise = media.matches ? 0 : (Math.sin(timestamp * 0.0031) + Math.sin(timestamp * 0.0017)) *
      WORKSPACE_EFFECTS_CONFIG.confidenceNoiseAmplitude / 2;
    hand.confidence = Math.max(
      WORKSPACE_EFFECTS_CONFIG.confidenceMin,
      Math.min(
        WORKSPACE_EFFECTS_CONFIG.confidenceMax,
        WORKSPACE_EFFECTS_CONFIG.confidenceBase - WORKSPACE_EFFECTS_CONFIG.confidenceSpeedFactor * speed + noise,
      ),
    );
    hand.confidenceAt = timestamp;
  }

  function mouseBounds(point: Point, layout = geometry()): Box {
    const width = WORKSPACE_EFFECTS_CONFIG.mouseWidthKeys * layout.scaleKx;
    const height = WORKSPACE_EFFECTS_CONFIG.mouseHeightKeys * layout.scaleKx;
    return { left: point.x - width / 2, right: point.x + width / 2, top: point.y - height / 2, bottom: point.y + height / 2 };
  }

  function clickAlpha(button: number, timestamp: number) {
    if (mouseButtons.has(button)) return 1;
    const elapsed = timestamp - (mouseClickAt.get(button) ?? -Infinity);
    return Math.max(0, 1 - elapsed / WORKSPACE_EFFECTS_CONFIG.mouseClickDurationMs);
  }

  function boxCorners(box: Box): Point[] {
    return [
      { x: box.left, y: box.top }, { x: box.right, y: box.top },
      { x: box.left, y: box.bottom }, { x: box.right, y: box.bottom },
    ];
  }

  function drawMouse(
    context: CanvasRenderingContext2D,
    point: Point,
    layout: ReturnType<typeof geometry>,
    scrolling: boolean,
    rightHandOnMouse: boolean,
    timestamp: number,
  ) {
    const box = mouseBounds(point, layout);
    const width = box.right - box.left;
    const height = box.bottom - box.top;
    context.save();
    context.strokeStyle = palette.ink;
    context.lineWidth = 1;
    context.globalAlpha = 0.55;
    roundedRect(context, box.left, box.top, width, height, width * 0.42);
    context.stroke();
    context.beginPath();
    context.moveTo(box.left + 0.5, box.top + height * 0.4);
    context.lineTo(box.right - 0.5, box.top + height * 0.4);
    context.stroke();
    context.globalAlpha = scrolling ? 1 : 0.8;
    context.strokeStyle = scrolling ? palette.accent : palette.dim;
    roundedRect(context, point.x - 1.5, box.top + height * 0.12, 3, height * 0.18, 1.5);
    context.stroke();
    if (WORKSPACE_EFFECTS_CONFIG.mouseBoxWhenIdle && !rightHandOnMouse) drawIdleMouseBox(context, point, layout, timestamp);
    context.restore();
  }

  function drawMouseClickFeedback(
    context: CanvasRenderingContext2D,
    point: Point,
    layout: ReturnType<typeof geometry>,
    timestamp: number,
  ) {
    const box = mouseBounds(point, layout);
    const dividerY = box.top + (box.bottom - box.top) * 0.4;
    const drawButton = (button: number, left: boolean) => {
      const alpha = clickAlpha(button, timestamp);
      if (alpha <= 0) return;
      const outerX = left ? point.x : box.right - 1;
      const innerX = left ? box.left + 1 : point.x;
      context.save();
      context.fillStyle = palette.accent;
      context.globalAlpha = 0.88 * alpha;
      context.beginPath();
      context.moveTo(point.x, box.top + 1);
      context.lineTo(outerX, box.top + 1);
      context.lineTo(innerX, dividerY - 1);
      context.closePath();
      context.fill();
      context.globalAlpha = 0.95 * alpha;
      context.strokeStyle = palette.accent;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(point.x, box.top + 2);
      context.lineTo(outerX, box.top + 2);
      context.lineTo(innerX, dividerY - 1);
      context.closePath();
      context.stroke();
      context.restore();
    };
    drawButton(0, true);
    drawButton(2, false);
  }

  function drawIdleMouseBox(context: CanvasRenderingContext2D, point: Point, layout: ReturnType<typeof geometry>, timestamp: number) {
    const target = mouseBounds(point, layout);
    context.save();
    context.strokeStyle = palette.ink;
    context.globalAlpha = 0.45;
    context.lineWidth = 1;
    const padding = WORKSPACE_EFFECTS_CONFIG.boxPaddingPx;
    context.strokeRect(Math.round(target.left - padding) + 0.5, Math.round(target.top - padding) + 0.5,
      target.right - target.left + padding * 2, target.bottom - target.top + padding * 2);
    drawMouseLabel(context, {
      left: target.left - padding,
      top: target.top - padding,
      right: target.right + padding,
      bottom: target.bottom + padding,
    }, timestamp);
    context.restore();
  }

  function drawMouseLabel(context: CanvasRenderingContext2D, box: Box, timestamp: number) {
    const x = box.right + 5 + 85 < deskSize.width ? box.right + 5 : Math.max(4, box.left - 5);
    const align: CanvasTextAlign = x > box.right ? 'left' : 'right';
    if (timestamp - mouseConfidenceAt >= WORKSPACE_EFFECTS_CONFIG.confidenceRefreshMs) {
      const overlap = Math.hypot(mousePosition.x - hands.right.wrist.x, mousePosition.y - hands.right.wrist.y);
      mouseConfidence = Math.max(0.3, Math.min(0.97, 0.36 + (Math.sin(timestamp * 0.0021) + 1) * 0.035));
      mouseOverlapConfidence = Math.max(0.3, Math.min(0.97, 0.88 - overlap / Math.max(deskSize.width, 1) * 0.08));
      mouseConfidenceAt = timestamp;
    }
    context.save();
    context.globalAlpha = 0.9;
    context.fillStyle = palette.dim;
    context.font = '11px "IBM Plex Mono", monospace';
    context.textAlign = align;
    context.textBaseline = 'top';
    context.fillText(`['mouse:u'] ${mouseConfidence.toFixed(WORKSPACE_EFFECTS_CONFIG.labelDigits)}`, x, box.top + 4);
    context.fillText(mouseOverlapConfidence.toFixed(WORKSPACE_EFFECTS_CONFIG.labelDigits), x, box.top + 17);
    context.restore();
  }

  function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawDebug(context: CanvasRenderingContext2D, timestamp: number) {
    debugInfo = { burst: burstDistance, queue: queuedStrikes.length, autoTyping: autoTyping || timestamp < autoTypingUntil };
    context.save();
    context.fillStyle = palette.accent;
    context.font = '9px "IBM Plex Mono", monospace';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText(`right ${rightState} · key ${Math.round(timestamp - lastKeyAt)}ms · move ${Math.round(timestamp - lastMoveAt)}ms`, 4, 3);
    context.fillText(`queue ${debugInfo.queue} · auto ${debugInfo.autoTyping} · burst ${debugInfo.burst.toFixed(1)}px`, 4, 14);
    for (const point of [...makeLandmarks('left', hands.left, timestamp, geometry()), ...makeLandmarks('right', hands.right, timestamp, geometry())].filter((_, index) => index % 4 === 0)) {
      context.beginPath();
      context.moveTo(point.x - 3, point.y);
      context.lineTo(point.x + 3, point.y);
      context.moveTo(point.x, point.y - 3);
      context.lineTo(point.x, point.y + 3);
      context.stroke();
    }
    context.restore();
  }

  function onPointerMove(event: PointerEvent) {
    const point = { x: event.clientX, y: event.clientY };
    cursorPosition = point;
    if (event.isTrusted) {
      const now = performance.now();
      if (lastPointer) {
        const distance = Math.hypot(point.x - lastPointer.x, point.y - lastPointer.y);
        if (distance >= 2) {
          if (now - burstStart > WORKSPACE_EFFECTS_CONFIG.grabWindowMs) {
            burstStart = now;
            burstDistance = 0;
          }
          burstDistance += distance;
          lastMoveAt = now;
          const layout = geometry();
          const typing = autoTyping || now < autoTypingUntil || now - lastKeyAt < WORKSPACE_EFFECTS_CONFIG.typingHoldMs;
          if (!typing) {
            mouseTarget = {
              x: Math.max(2 * layout.scaleKx, Math.min(deskSize.width - 2 * layout.scaleKx, layout.mouse.x + (point.x / window.innerWidth - 0.5) * deskSize.width * 0.6)),
              y: Math.max(2 * layout.scaleKx, Math.min(deskSize.height - 2 * layout.scaleKx, layout.mouse.y + (point.y / window.innerHeight - 0.5) * deskSize.height * 0.6)),
            };
          }
        }
      }
      lastPointer = point;
    }
    syncMouseButtons(event.buttons);
    requestFrame();
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button === 0 || event.button === 2) mouseClickAt.set(event.button, performance.now());
    syncMouseButtons(event.buttons);
    requestFrame();
  }

  function onPointerUp(event: PointerEvent) {
    syncMouseButtons(event.buttons);
    requestFrame();
  }

  function syncMouseButtons(buttons: number) {
    if (buttons & 1) mouseButtons.add(0);
    else mouseButtons.delete(0);
    if (buttons & 2) mouseButtons.add(2);
    else mouseButtons.delete(2);
  }

  function onPointerCancel() {
    mouseButtons.clear();
    requestFrame();
  }

  function strike(code: string, now: number, forceLeft = false) {
    if (!isKnownKey(code)) return;
    lastKeyAt = now;
    keyPresses.set(code, { startedAt: now, until: now + 140 });
    let side: HandSide = forceLeft ? 'left' : code === 'Space' ? 'right' : fingerHand(code);
    if (side === 'right' && rightState !== 'KEYS') {
      queuedStrikes.push({ code, at: now, queuedAt: now });
      if (rightState === 'MOUSE' || rightState === 'TO_MOUSE') {
        const home = restWrist('right');
        transitionHand('TO_KEYS', now, home, true);
      }
      requestFrame();
      return;
    }
    keyStrikes.push({ code, hand: side, startedAt: now });
    hands[side].labelPulseUntil = now + 80;
    requestFrame();
  }

  function flushQueuedStrikes(now: number) {
    if (rightState !== 'KEYS' || handTransition) return;
    while (queuedStrikes.length > 0) {
      const queued = queuedStrikes[0];
      if (now - queued.queuedAt > Math.min(WORKSPACE_EFFECTS_CONFIG.queuedKeyLeftHandFallbackMs, WORKSPACE_EFFECTS_CONFIG.maxQueueAgeMs)) {
        queuedStrikes.shift();
        keyStrikes.push({ code: queued.code, hand: 'left', startedAt: now });
        continue;
      }
      if (now - queued.at < WORKSPACE_EFFECTS_CONFIG.keyQueueFlushMs ||
        now - lastQueueFlushAt < WORKSPACE_EFFECTS_CONFIG.keyQueueFlushMs) break;
      queuedStrikes.shift();
      keyStrikes.push({ code: queued.code, hand: 'right', startedAt: now });
      hands.right.labelPulseUntil = now + 80;
      lastQueueFlushAt = now;
      break;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;
    const now = performance.now();
    keyPresses.set(event.code, { startedAt: now, until: now + 140 });
    if (isKnownKey(event.code) && (rightState === 'MOUSE' || rightState === 'TO_MOUSE')) {
      transitionHand('TO_KEYS', now, restWrist('right'), true);
    }
    strike(event.code, now);
  }

  function onKeyUp(event: KeyboardEvent) {
    const press = keyPresses.get(event.code);
    if (press) press.until = Math.max(press.until, performance.now() + 90);
    requestFrame();
  }

  function onWindowBlur() {
    mouseButtons.clear();
    mouseClickAt.clear();
    keyPresses.clear();
    queuedStrikes.length = 0;
    requestFrame();
  }

  function onWheel() {
    lastWheelAt = performance.now();
    requestFrame();
  }

  function onVisibilityChange() {
    pageVisible = document.visibilityState !== 'hidden';
    previousFrameAt = 0;
    if (pageVisible) requestFrame();
    else if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function onMotionChange() {
    previousFrameAt = 0;
    requestFrame();
  }

  function onWindowResize() {
    resizeCanvases();
  }

  function onIntersect(entries: IntersectionObserverEntry[]) {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) requestFrame();
    else if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  const observer = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(onIntersect, { threshold: 0.01 })
    : null;
  observer?.observe(eyeHost);
  observer?.observe(deskHost);
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resizeCanvases) : null;
  resizeObserver?.observe(deskHost);
  resizeObserver?.observe(eyeHost);
  window.addEventListener('resize', onWindowResize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerCancel, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKeyDown, { passive: true });
  window.addEventListener('keyup', onKeyUp, { passive: true });
  window.addEventListener('blur', onWindowBlur);
  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  media.addEventListener('change', onMotionChange);
  resizeCanvases();

  const testHook = () => {
    const homeKeyContactPx = (side: HandSide) => handHomeKeys(side).map((code, digit) => {
      const target = keyCenter(code);
      const fingertip = renderedLandmarks[side][DIGITS[digit].joints.at(-1)!];
      return target && fingertip ? Number(Math.hypot(target.x - fingertip.x, target.y - fingertip.y).toFixed(2)) : null;
    });
    const report = {
      rightHandState: rightState,
      sinceLastKeyMs: Math.round(performance.now() - lastKeyAt),
      sinceLastMoveMs: Math.round(performance.now() - lastMoveAt),
      queuedKeys: queuedStrikes.length,
      autoTyping: autoTyping || performance.now() < autoTypingUntil,
      pointerBurstPx: Number(burstDistance.toFixed(1)),
      keyboardPitchPx: Number(geometry().kx.toFixed(2)),
      landmarksPerHand: REST_LANDMARKS.length,
      leftWrist: [Number(hands.left.wrist.x.toFixed(1)), Number(hands.left.wrist.y.toFixed(1))],
      rightWrist: [Number(hands.right.wrist.x.toFixed(1)), Number(hands.right.wrist.y.toFixed(1))],
      homeKeyContactPx: {
        left: homeKeyContactPx('left'),
        right: homeKeyContactPx('right'),
      },
      mousePoint: [Number(mousePosition.x.toFixed(1)), Number(mousePosition.y.toFixed(1))],
      mouseClickPulse: {
        left: Number(clickAlpha(0, performance.now()).toFixed(2)),
        right: Number(clickAlpha(2, performance.now()).toFixed(2)),
      },
      handMouseDistance: Number(Math.hypot(hands.right.wrist.x - mousePosition.x, hands.right.wrist.y - mousePosition.y).toFixed(1)),
      transition: handTransition ? {
        elapsedMs: Math.round(performance.now() - handTransition.startedAt),
        durationMs: Math.round(handTransition.duration),
      } : null,
    };
    console.table([report]);
    return report;
  };
  (window as Window & { __deskTest?: typeof testHook }).__deskTest = testHook;

  return {
    recolor() {
      palette = readPalette();
      requestFrame();
    },
    pressKey(code: string) {
      strike(code, performance.now());
    },
    setAutoTyping(active: boolean) {
      autoTyping = active;
      autoTypingUntil = active ? Infinity : performance.now() + WORKSPACE_EFFECTS_CONFIG.typingHoldMs;
      if (active && (rightState === 'MOUSE' || rightState === 'TO_MOUSE')) {
        transitionHand('TO_KEYS', performance.now(), restWrist('right'), true);
      }
      requestFrame();
    },
    setUpcoming(text: string) {
      upcomingText = text;
      requestFrame();
    },
    destroy() {
      destroyed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      media.removeEventListener('change', onMotionChange);
      const windowWithTest = window as Window & { __deskTest?: typeof testHook };
      if (windowWithTest.__deskTest === testHook) delete windowWithTest.__deskTest;
    },
  };
}
