import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { createWorkspaceEffects } from './workspace-effects';

type ThemeName = 'black' | 'violet' | 'green' | 'amber' | 'blue' | 'light';
type TerminalKind = 'command' | 'output' | 'error' | 'system';

type TerminalEntry = {
  kind: TerminalKind;
  text: string;
  href?: string;
};

type ProjectInfoLine = {
  label: string;
  value: string;
  href?: string;
};

type ProjectPreview = {
  src: string;
  label: string;
  alt: string;
  kind: 'screenshot' | 'artwork';
  fit?: 'contain' | 'cover';
};

type PortfolioProject = {
  id: string;
  title: string;
  path: string;
  description: string;
  language: string;
  repositoryUrl?: string;
  liveUrl?: string;
  previews: ProjectPreview[];
};

type KeyboardVisualKey = {
  code: string;
  label: string;
  wide?: boolean;
  space?: boolean;
  anchor: { x: number; y: number };
};

type PointerTelemetry = {
  x: number;
  y: number;
  u: number;
  v: number;
  type: string;
  tracked: boolean;
};

type CvSlide = 'whoami' | 'certifications' | 'resume';
type IntroStage = 'complete' | 'monogram' | 'boot' | 'editor' | 'typing' | 'handoff';

type Certificate = {
  title: string;
  file: string;
};

const WHEEL_CONFIG = {
  cardWidth: 150,
  cardHeight: 94,
  radius: 480,
  angleStep: 0.1704,
  mobileAngleStep: 0.34,
  baseX: 3,
  selectedScale: 1,
  otherScale: 0.64,
  shade: 0.26,
  shadeStep: 0.08,
  leftBleed: 150,
  maxDpr: 2,
} as const;

function createKeyboardRow(
  codesAndLabels: Array<[string, string] | [string, string, 'wide' | 'space']>,
  rowIndex: number,
  xOffset = 0,
): KeyboardVisualKey[] {
  return codesAndLabels.map(([code, label, size], index) => ({
    code,
    label,
    wide: size === 'wide',
    space: size === 'space',
    anchor: { x: 28 + xOffset + index * 39, y: 15 + rowIndex * 24 },
  }));
}

@Component({
  selector: 'app-root',
  imports: [NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-theme]': 'activeTheme()',
    '(window:pointermove)': 'onWindowPointerMove($event)',
    '(window:pointerdown)': 'onWindowPointerDown($event)',
    '(window:pointerup)': 'onWindowPointerUp($event)',
    '(window:pointercancel)': 'onWindowPointerUp($event)',
    '(window:keyup)': 'onInputKeyUp($event)',
    '(window:blur)': 'onWindowBlur()',
    '(document:mouseleave)': 'onWindowLeave()',
    '(document:visibilitychange)': 'onDocumentVisibilityChange()',
    '(window:resize)': 'onWindowGeometryChange()',
    '(window:scroll)': 'onWindowGeometryChange()',
    '(window:keydown)': 'onWindowKeydown($event)',
  },
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly themeNames: ThemeName[] = ['black', 'violet', 'green', 'amber', 'blue', 'light'];
  protected readonly activeTheme = signal<ThemeName>('black');
  protected readonly introStage = signal<IntroStage>('complete');
  protected readonly introTypedLength = signal(0);
  protected readonly introLogLines = signal(0);
  protected readonly introActive = signal(false);
  protected readonly workspacePath = signal('~/Projects');
  protected readonly focusMode = signal<'wheel' | 'pane' | 'terminal'>('wheel');
  protected readonly terminalInput = signal('');
  protected readonly terminalHistory = signal<string[]>([]);
  protected readonly terminalHistoryIndex = signal<number | null>(null);
  protected readonly terminalEntries = signal<TerminalEntry[]>([]);
  protected readonly projectData: PortfolioProject[] = [
    {
      id: 'lorekeeper',
      title: 'Lorekeeper',
      path: '~/Projects/lorekeeper',
      description: 'A full-stack campaign management app for tabletop RPG games.',
      language: 'HTML',
      repositoryUrl: 'https://github.com/shokomori/Lorekeeper',
      liveUrl: 'https://shokomori.github.io/Lorekeeper/',
      previews: [
        {
          src: 'previews/lorekeeper-landing-cover.jpg',
          label: 'Campaign landing page',
          alt: 'Lorekeeper campaign landing page with the project logo and fantasy artwork.',
          kind: 'screenshot',
        },
        {
          src: 'previews/lorekeeper-dashboard-empty.jpg',
          label: 'Campaign dashboard',
          alt: 'Lorekeeper campaign dashboard showing the campaign navigation, dashboard, and campaign summary.',
          kind: 'screenshot',
        },
        {
          src: 'previews/lorekeeper-sessions.jpg',
          label: 'Campaign sessions',
          alt: 'Lorekeeper sessions page showing a saved campaign session.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'tekken-pitch-deck',
      title: 'Tekken Pitch Deck',
      path: '~/Projects/tekken-pitch-deck',
      description: 'A presentation project centered on a Tekken pitch deck.',
      language: 'HTML',
      repositoryUrl: 'https://github.com/shokomori/Tekken-Pitch-Deck',
      liveUrl: 'https://shokomori.github.io/Tekken-Pitch-Deck/',
      previews: [
        {
          src: 'previews/tekken-pitch-deck.png',
          label: 'Pampanga Powerhouse homepage',
          alt: 'Pampanga Powerhouse Tekken 8 community website with its tournament photo and event links.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'voxfilter',
      title: 'VoxFilter',
      path: '~/Projects/voxfilter',
      description: 'A web application for cleaning background noise and isolating clearer voice audio for output and download.',
      language: 'C#',
      repositoryUrl: 'https://github.com/shokomori/VoxFilter',
      previews: [
        {
          src: 'previews/voxfilter-audio-cleanup.svg',
          label: 'Audio cleanup workflow illustration',
          alt: 'Illustration of VoxFilter transforming a noisy voice recording into a clearer isolated voice track.',
          kind: 'artwork',
        },
      ],
    },
    {
      id: 'gitsprint',
      title: 'GitSprint',
      path: '~/Projects/gitsprint',
      description: 'An automated GitHub commit tool for generating and scheduling repository changes as part of workflow-testing and automation experiments.',
      language: 'JavaScript',
      repositoryUrl: 'https://github.com/shokomori/GitSprint',
      previews: [
        {
          src: 'previews/gitsprint-dashboard.png',
          label: 'Live run dashboard',
          alt: 'GitSprint dashboard waiting to start a run, with commit counters, speed controls, and an activity feed.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'tcg-proxy-template',
      title: 'TCG Proxy Template',
      path: '~/Projects/tcg-proxy-template',
      description: 'A drag-and-drop web app that converts card images into print-ready proxy sheets for streamlined tabletop preparation.',
      language: 'HTML',
      repositoryUrl: 'https://github.com/shokomori/TCG-Proxy-Template',
      liveUrl: 'https://tcg-proxy-template.vercel.app/',
      previews: [
        {
          src: 'previews/tcg-proxy-template.png',
          label: 'Print sheet workspace',
          alt: 'Shoko Proxy Maker workspace with a nine-card print sheet, card-size settings, and PDF export controls.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'chainpulse',
      title: 'ChainPulse',
      path: '~/Projects/chainpulse',
      description: 'A decentralized news platform for blockchain-based verification and decentralized identity.',
      language: 'HTML',
      repositoryUrl: 'https://github.com/shokomori/ChainPulse',
      liveUrl: 'https://shokomori.github.io/ChainPulse/',
      previews: [
        {
          src: 'previews/chainpulse.png',
          label: 'News verification homepage',
          alt: 'ChainPulse homepage introducing blockchain-verified news with feed, verification, and journalist navigation.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'bataan-campus-finder',
      title: 'Bataan Campus Finder',
      path: '~/Projects/bataan-campus-finder',
      description: 'A campus discovery platform for exploring and locating educational institutions across Bataan with a focus on practical browsing.',
      language: 'HTML',
      repositoryUrl: 'https://github.com/shokomori/Bataan-Campus-Finder',
      liveUrl: 'https://shokomori.github.io/Bataan-Campus-Finder/',
      previews: [
        {
          src: 'previews/bataan-campus-finder.png',
          label: 'Campus finder homepage',
          alt: 'Bataan Campus Finder homepage with its campus search introduction and summary cards.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'helpify-ai',
      title: 'Helpify-AI',
      path: '~/Projects/helpify-ai',
      description: 'An intelligent customer support AI using Text-CNN for intent classification and reinforcement learning for adaptive, real-world assistance.',
      language: 'Python',
      repositoryUrl: 'https://github.com/shokomori/Helpify-AI',
      previews: [
        {
          src: 'previews/helpify-ai-dashboard.png',
          label: 'Customer support dashboard',
          alt: 'Helpify AI customer support dashboard showing intent classes, the chat workspace, and model analytics.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'virtuo-hero',
      title: 'Virtuo-Hero',
      path: '~/Projects/virtuo-hero',
      description: 'VirtuoHero is a mobile platform that uses AI to help Filipino freelancers and students grow skills, track progress, and build career readiness.',
      language: 'Dart',
      repositoryUrl: 'https://github.com/shokomori/Virtuo-Hero',
      previews: [
        {
          src: 'previews/virtuohero-mascot.png',
          label: 'VirtuoHero mascot artwork',
          alt: 'The original VirtuoHero mascot artwork from the mobile app repository.',
          kind: 'artwork',
          fit: 'contain',
        },
      ],
    },
    {
      id: 'jeepboxhero',
      title: 'JeepBoxHero',
      path: '~/Projects/jeepboxhero',
      description: 'A Filipino-inspired interactive software concept blending cultural themes with creative systems and experience design.',
      language: 'Dart',
      repositoryUrl: 'https://github.com/shokomori/JeepBoxHero',
      previews: [
        {
          src: 'previews/jeepboxhero-record-shop.jpg',
          label: 'Record shop game artwork',
          alt: 'JeepBoxHero record-shop artwork from the game assets.',
          kind: 'artwork',
        },
      ],
    },
    {
      id: 'vivy-fraud-detection',
      title: 'Vivy Fraud Detection',
      path: '~/Projects/vivy-fraud-detection',
      description: 'A fraud-detection project for identifying suspicious GCash electronic payment receipts using image-processing pattern analysis.',
      language: 'Python',
      repositoryUrl: 'https://github.com/shokomori/vivy-fraud-detection',
      previews: [
        {
          src: 'previews/vivy-home-screen.png',
          label: 'Vivy app home screen',
          alt: 'Vivy mobile app home screen with receipt verification, scan summary, and fraud prevention tips.',
          kind: 'screenshot',
          fit: 'contain',
        },
        {
          src: 'previews/vivy-upload-screen.png',
          label: 'Receipt upload screen',
          alt: 'Vivy mobile app receipt upload screen with image selection and guidance for a clear scan.',
          kind: 'screenshot',
          fit: 'contain',
        },
      ],
    },
    {
      id: 'apocrypha',
      title: 'Apocrypha',
      path: '~/Projects/apocrypha',
      description: "A music discovery website for tracking what you've listened to, saving songs to explore, and sharing recommendations with friends.",
      language: 'CSS',
      repositoryUrl: 'https://github.com/shokomori/apocrypha',
      liveUrl: 'https://shokomori.github.io/apocrypha/',
      previews: [
        {
          src: 'previews/apocrypha.png',
          label: 'Music discovery landing page',
          alt: 'Apocrypha music discovery landing page with its illustrated background and listening diary introduction.',
          kind: 'screenshot',
        },
      ],
    },
    {
      id: 'angular-portfolio',
      title: 'Angular Portfolio',
      path: '~/Projects/angular-portfolio',
      description: 'A portfolio for sharing technical work and creative interests, brought together with a reactive interface and a considered visual system.',
      language: 'TypeScript',
      repositoryUrl: 'https://github.com/shokomori/Masato-Martin-Portfolio',
      liveUrl: 'https://shokomori.github.io/Masato-Martin-Portfolio/',
      previews: [
        {
          src: 'previews/angular-portfolio.png',
          label: 'Portfolio workspace',
          alt: 'Masato Martin portfolio workspace with the project wheel, terminal details, and live project preview.',
          kind: 'screenshot',
        },
      ],
    },
  ];

  protected readonly selectedProjectIndex = signal(0);
  protected readonly selectedProject = signal<PortfolioProject>(this.projectData[0]);
  protected readonly mobileProjectMenuOpen = signal(false);
  protected readonly wheelDebug = signal(false);
  protected readonly wheelLayoutReady = signal(false);
  protected readonly previewIndex = signal(0);
  protected readonly lightboxOpen = signal(false);
  protected readonly cvOpen = signal(false);
  protected readonly cvSlide = signal<CvSlide>('resume');
  protected readonly cvSlides: Array<{ id: CvSlide; label: string }> = [
    { id: 'whoami', label: 'whoami' },
    { id: 'certifications', label: 'certifications' },
    { id: 'resume', label: 'cv pdf' },
  ];
  protected readonly certificates: Certificate[] = [
    { title: 'AI Fundamentals with IBM SkillsBuild', file: 'AI Fundamentals with IBM SkillsBuild.jpg' },
    { title: 'AWS Academy Graduate - Cloud Foundations - Training Badge', file: 'AWS Academy Graduate - Cloud Foundations - Training Badge.jpg' },
    { title: 'AWS Services Overview for IT Professionals', file: 'AWS Services Overview for IT Professionals.jpg' },
    { title: 'Blockchain Certification Training', file: 'Blockchain Certification Training.jpg' },
    { title: 'Build Dynamic User Interfaces (UI) for Websites', file: 'Build Dynamic User Interfaces (UI) for Websites.jpg' },
    { title: 'Build Wireframes and Low-Fidelity Prototypes', file: 'Build Wireframes and Low-Fidelity Prototypes.jpg' },
    { title: 'Computer Hardware Basics', file: 'Computer Hardware Basics.jpg' },
    { title: 'Conduct UX Research and Test Early Concepts', file: 'Conduct UX Research and Test Early Concepts.jpg' },
    { title: 'Developing AI Applications with Python and Flask', file: 'Developing AI Applications with Python and Flask.jpg' },
    { title: 'Developing Back-End Apps with Node.js and Express', file: 'Developing Back-End Apps with Node.js and Express.jpg' },
    { title: 'Developing Front-End Apps with React', file: 'Developing Front-End Apps with React.jpg' },
    { title: 'Foundations of Project Management', file: 'Foundations of Project Management.jpg' },
    { title: 'Foundations of User Experience (UX) Design', file: 'Foundations of User Experience (UX) Design.jpg' },
    { title: 'Generative AI for Beginners', file: 'Generative AI for Beginners.jpg' },
    { title: 'Getting Python Interview Ready', file: 'Getting Python Interview Ready.jpg' },
    { title: 'Getting Started with Git and GitHub', file: 'Getting Started with Git and GitHub.jpg' },
    { title: 'Innovating with Google Cloud AI', file: 'Innovating with Google Cloud AI.jpg' },
    { title: 'Introduction to Cloud Computing', file: 'Introduction to Cloud Computing.jpg' },
    { title: 'Introduction to Data Science Skill Up', file: 'Introduction to Data Science Skill Up.jpg' },
    { title: 'Introduction to Data Science', file: 'Introduction to Data Science.jpg' },
    { title: 'Introduction to Figma', file: 'Introduction to Figma.png' },
    { title: 'Introduction to Flutter Course Online', file: 'Introduction to Flutter Course Online.jpg' },
    { title: 'Introduction to HTML, CSS, & JavaScript', file: 'Introduction to HTML, CSS, & JavaScript.jpg' },
    { title: 'Introduction to Software Engineering', file: 'Introduction to Software Engineering.jpg' },
    { title: 'Project Management 101', file: 'Project Management 101.jpg' },
    { title: 'Python for Data Science, AI & Development', file: 'Python for Data Science, AI & Development.jpg' },
    { title: 'Relational Database', file: 'Relational Database.jpg' },
    { title: 'Start the UX Design Process: Empathize, Define, and Ideate', file: 'Start the UX Design Process Empathize, Define, and Ideate.jpg' },
  ];
  protected readonly terminalTyping = signal(false);
  protected readonly activeKeyCodes = signal<string[]>([]);
  protected readonly scriptedKeyCode = signal<string | null>(null);
  protected readonly pointerTelemetry = signal<PointerTelemetry>({
    x: 0,
    y: 0,
    u: 0.5,
    v: 0.5,
    type: 'idle',
    tracked: false,
  });
  protected readonly pointerButtons = signal<number[]>([]);
  protected readonly keyboardRows: KeyboardVisualKey[][] = [
    createKeyboardRow([
      ['Escape', 'esc'], ['F1', 'F1'], ['F2', 'F2'], ['F3', 'F3'], ['F4', 'F4'],
      ['F5', 'F5'], ['F6', 'F6'], ['F7', 'F7'], ['F8', 'F8'], ['F9', 'F9'],
      ['F10', 'F10'], ['F11', 'F11'], ['F12', 'F12'],
    ], 0),
    createKeyboardRow([
      ['Backquote', '`'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'],
      ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'],
      ['Digit8', '8'], ['Digit9', '9'], ['Digit0', '0'], ['Minus', '-'],
      ['Equal', '='], ['Backspace', 'back', 'wide'],
    ], 1),
    createKeyboardRow([
      ['Tab', 'tab', 'wide'], ['KeyQ', 'q'], ['KeyW', 'w'], ['KeyE', 'e'],
      ['KeyR', 'r'], ['KeyT', 't'], ['KeyY', 'y'], ['KeyU', 'u'],
      ['KeyI', 'i'], ['KeyO', 'o'], ['KeyP', 'p'], ['BracketLeft', '['],
      ['BracketRight', ']'], ['Backslash', '\\'],
    ], 2),
    createKeyboardRow([
      ['CapsLock', 'caps', 'wide'], ['KeyA', 'a'], ['KeyS', 's'], ['KeyD', 'd'],
      ['KeyF', 'f'], ['KeyG', 'g'], ['KeyH', 'h'], ['KeyJ', 'j'],
      ['KeyK', 'k'], ['KeyL', 'l'], ['Semicolon', ';'], ['Quote', "'"],
      ['Enter', 'enter', 'wide'],
    ], 3),
    createKeyboardRow([
      ['ShiftLeft', 'shift', 'wide'], ['KeyZ', 'z'], ['KeyX', 'x'], ['KeyC', 'c'],
      ['KeyV', 'v'], ['KeyB', 'b'], ['KeyN', 'n'], ['KeyM', 'm'],
      ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['ShiftRight', 'shift', 'wide'],
    ], 4),
    createKeyboardRow([
      ['ControlLeft', 'ctrl', 'wide'], ['MetaLeft', 'cmd'], ['AltLeft', 'alt'],
      ['Space', '', 'space'], ['AltRight', 'alt'], ['ArrowLeft', '←'],
      ['ArrowDown', '↓'], ['ArrowUp', '↑'], ['ArrowRight', '→'],
    ], 5, 35),
  ];
  protected readonly wheelLayout = signal<{
    width: number;
    height: number;
    cardWidth: number;
    cardHeight: number;
    radius: number;
    angleStep: number;
    baseX: number;
  }>({
    width: 230.4,
    height: 579,
    cardWidth: WHEEL_CONFIG.cardWidth,
    cardHeight: WHEEL_CONFIG.cardHeight,
    radius: 200,
    angleStep: WHEEL_CONFIG.angleStep,
    baseX: WHEEL_CONFIG.baseX,
  });

  @ViewChild('wheelHost') private wheelHost?: ElementRef<HTMLElement>;
  @ViewChild('wheelInk') private wheelInk?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trackingLine') private trackingLine?: ElementRef<HTMLCanvasElement>;
  @ViewChild('eyeFrame') private eyeFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('handsFrame') private handsFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('eyeHost') private eyeHost?: ElementRef<HTMLElement>;
  @ViewChild('deskCanvas') private deskCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('deskHost') private deskHost?: ElementRef<HTMLElement>;
  @ViewChild('projectPane') private projectPane?: ElementRef<HTMLElement>;
  @ViewChild('commandInput') private commandInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminalOutput') private terminalOutput?: ElementRef<HTMLElement>;
  @ViewChild('interactionLayer') private interactionLayer?: ElementRef<HTMLElement>;

  private wheelResizeObserver: ResizeObserver | null = null;
  private workspaceEffects: ReturnType<typeof createWorkspaceEffects> | null = null;
  private terminalTypingTimer: number | null = null;
  private typingTargetFrame: number | null = null;
  private terminalTypingQueue: TerminalEntry[] = [];
  private terminalTypingCurrent: TerminalEntry | null = null;
  private terminalTypingPosition = 0;
  private scriptedKeyTimer: number | null = null;
  private projectRevealAnimation: Animation | null = null;
  private projectCardAnimation: Animation | null = null;
  private pointerAnimations = new Set<Animation>();
  private pointerPosition = { x: 0, y: 0, type: 'mouse' };
  private wheelDelta = 0;
  private wheelLocked = false;
  private wheelUnlockTimer: number | null = null;
  private wheelDeltaResetTimer: number | null = null;
  private wheelClickSuppressionTimer: number | null = null;
  private introTimer: number | null = null;
  private introStarted = false;
  private readonly introCommand = ':e ~/Projects/lorekeeper';
  protected readonly introMessages = [
    'session ........ ready',
    `projects ....... ${this.projectData.length} indexed`,
    'input .......... armed',
  ];
  private terminalDraft = '';
  private dragPointerId: number | null = null;
  private dragLastY = 0;
  private dragMoved = false;
  private suppressNextWheelClick = false;
  private lightboxReturnFocus: HTMLElement | null = null;
  private cvReturnFocus: HTMLElement | null = null;

  constructor() {
    this.applyTheme(this.resolveStoredTheme());
    this.startIntro();
    this.selectProject(0);
  }

  ngAfterViewInit(): void {
    this.measureWheelGeometry();
    const overlay = this.trackingLine?.nativeElement;
    const eyeFrame = this.eyeFrame?.nativeElement;
    const handsFrame = this.handsFrame?.nativeElement;
    const eyeHost = this.eyeHost?.nativeElement;
    const desk = this.deskCanvas?.nativeElement;
    const deskHost = this.deskHost?.nativeElement;
    const wheelHost = this.wheelHost?.nativeElement;
    const themeRoot = document.querySelector<HTMLElement>('app-root');
    if (overlay && eyeFrame && handsFrame && eyeHost && desk && deskHost && wheelHost && themeRoot) {
      this.workspaceEffects = createWorkspaceEffects({ overlay, eyeFrame, handsFrame, eyeHost, desk, deskHost, wheelHost, themeRoot });
    }
    this.wheelDebug.set(new URLSearchParams(window.location.search).get('debug') === '1');
    if (this.wheelDebug()) {
      window.requestAnimationFrame(() => this.logWheelBounds());
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.wheelResizeObserver = new ResizeObserver(() => {
        this.measureWheelGeometry();
        if (this.wheelDebug()) {
          window.requestAnimationFrame(() => this.logWheelBounds());
        }
      });
      if (this.wheelHost) {
        this.wheelResizeObserver.observe(this.wheelHost.nativeElement);
      }
    }
  }

  ngOnDestroy(): void {
    this.workspaceEffects?.destroy();
    this.wheelResizeObserver?.disconnect();
    if (this.terminalTypingTimer !== null) {
      window.clearTimeout(this.terminalTypingTimer);
    }
    if (this.typingTargetFrame !== null) {
      window.cancelAnimationFrame(this.typingTargetFrame);
    }
    if (this.scriptedKeyTimer !== null) {
      window.clearTimeout(this.scriptedKeyTimer);
    }
    this.projectRevealAnimation?.cancel();
    this.projectCardAnimation?.cancel();
    for (const animation of this.pointerAnimations) {
      animation.cancel();
    }
    this.pointerAnimations.clear();
    if (this.wheelUnlockTimer !== null) {
      window.clearTimeout(this.wheelUnlockTimer);
    }
    if (this.wheelDeltaResetTimer !== null) {
      window.clearTimeout(this.wheelDeltaResetTimer);
    }
    if (this.wheelClickSuppressionTimer !== null) {
      window.clearTimeout(this.wheelClickSuppressionTimer);
    }
    if (this.introTimer !== null) {
      window.clearTimeout(this.introTimer);
    }
  }

  protected onWindowPointerMove(event: PointerEvent): void {
    this.updatePointerTelemetry(event.clientX, event.clientY, event.pointerType || 'mouse');
    if (event.pointerType === 'touch') {
      return;
    }
  }

  protected onWindowPointerDown(event: PointerEvent): void {
    this.updatePointerTelemetry(event.clientX, event.clientY, event.pointerType || 'mouse');
    this.setPointerButtons(event.buttons || (event.button >= 0 ? 1 << event.button : 0));
    if (this.prefersReducedMotion()) {
      return;
    }

    const layer = this.interactionLayer?.nativeElement;
    if (!layer) {
      return;
    }

    const ripple = document.createElement('span');
    ripple.className = 'pointer-ripple';
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    layer.append(ripple);
    if (typeof ripple.animate !== 'function') {
      ripple.remove();
      return;
    }

    const animation = ripple.animate(
      [
        { opacity: 0.76, transform: 'translate(-50%, -50%) scale(0.25)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(5)' },
      ],
      { duration: 460, easing: 'cubic-bezier(0.2, 0.72, 0.24, 1)' },
    );
    this.pointerAnimations.add(animation);
    animation.onfinish = () => {
      this.pointerAnimations.delete(animation);
      ripple.remove();
    };
  }

  protected onWindowPointerUp(event: PointerEvent): void {
    this.updatePointerTelemetry(event.clientX, event.clientY, event.pointerType || 'mouse');
    this.setPointerButtons(event.buttons);
  }

  protected onWindowLeave(): void {
    this.pointerButtons.set([]);
  }

  protected onWindowBlur(): void {
    this.activeKeyCodes.set([]);
    this.pointerButtons.set([]);
  }

  protected onInputKeyDown(event: KeyboardEvent): void {
    const code = event.code || this.getKeyCodeFromKey(event.key);
    if (!code || this.activeKeyCodes().includes(code)) {
      return;
    }
    this.activeKeyCodes.update((active) => [...active, code]);
  }

  protected onInputKeyUp(event: KeyboardEvent): void {
    const code = event.code || this.getKeyCodeFromKey(event.key);
    if (code && this.activeKeyCodes().includes(code)) {
      this.activeKeyCodes.update((active) => active.filter((activeCode) => activeCode !== code));
    }
  }

  protected onDocumentVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.finishTerminalTyping();
      this.activeKeyCodes.set([]);
      this.pointerButtons.set([]);
    }
  }

  protected onWindowGeometryChange(): void {
    this.measureWheelGeometry();
    this.scheduleTypingTargetUpdate();
    if (this.pointerTelemetry().tracked) {
      this.updatePointerTelemetry(this.pointerPosition.x, this.pointerPosition.y, this.pointerPosition.type);
    }
    if (this.wheelDebug()) {
      window.requestAnimationFrame(() => this.logWheelBounds());
    }
  }

  protected onWindowKeydown(event: KeyboardEvent): void {
    if (this.introActive()) {
      return;
    }
    this.onInputKeyDown(event);
    if (this.mobileProjectMenuOpen() && event.key === 'Escape') {
      event.preventDefault();
      this.mobileProjectMenuOpen.set(false);
      return;
    }
    if (this.cvOpen()) {
      if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>(
          '.cv-dialog button:not(:disabled), .cv-dialog a[href], .cv-dialog iframe, .cv-dialog [tabindex]:not([tabindex="-1"])',
        ));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeCv();
      } else if (
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        (event.target instanceof HTMLElement && event.target.getAttribute('role') === 'tab')
      ) {
        event.preventDefault();
        this.moveCvSlide(event.key === 'ArrowRight' ? 1 : -1);
      }
      return;
    }
    if (this.lightboxOpen()) {
      if (event.key === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLElement>('.lightbox button:not(:disabled)'));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeLightbox();
      } else if (event.key === 'ArrowLeft' && this.getActiveProjectPreviews().length > 1) {
        event.preventDefault();
        this.previousPreview();
      } else if (event.key === 'ArrowRight' && this.getActiveProjectPreviews().length > 1) {
        event.preventDefault();
        this.nextPreview();
      }
      return;
    }

    if (this.isEditableTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    const eventTarget = event.target instanceof HTMLElement ? event.target : null;
    const activeElement = document.activeElement;
    const inWheel = !!eventTarget?.closest('.wheel') || !!this.wheelHost?.nativeElement.contains(activeElement);
    const inProjectPane =
      !!eventTarget?.closest('.buffer') ||
      (activeElement instanceof HTMLElement && activeElement.closest('.buffer') !== null);
    const isWorkspaceContext =
      eventTarget === document.body ||
      eventTarget === document.documentElement ||
      inWheel ||
      activeElement === document.body;

    if ((isWorkspaceContext || inProjectPane) && key === ':') {
      event.preventDefault();
      const input = this.commandInput?.nativeElement;
      if (input) {
        this.terminalInput.set(':');
        input.value = ':';
        input.focus();
      }
    } else if (isWorkspaceContext && (key === 'arrowdown' || key === 'j' || key === 'arrowup' || key === 'k')) {
      event.preventDefault();
      this.navigateProject(key === 'arrowdown' || key === 'j' ? 1 : -1, inWheel);
    } else if (inWheel && key === 'enter') {
      event.preventDefault();
      this.activateProject();
    } else if (inProjectPane && key === 'escape') {
      event.preventDefault();
      this.focusSelectedProject();
    } else if (isWorkspaceContext && key === 'arrowleft' && this.getActiveProjectPreviews().length > 1) {
      event.preventDefault();
      this.previousPreview();
    } else if (isWorkspaceContext && key === 'arrowright' && this.getActiveProjectPreviews().length > 1) {
      event.preventDefault();
      this.nextPreview();
    }

  }

  protected getProjectBufferLines(project = this.selectedProject()): ProjectInfoLine[] {
    return [
      { label: 'lang', value: project.language },
      ...(project.repositoryUrl ? [{ label: 'source', value: project.repositoryUrl, href: project.repositoryUrl }] : []),
      ...(project.liveUrl ? [{ label: 'live', value: project.liveUrl, href: project.liveUrl }] : []),
      {
        label: 'preview',
        value: project.previews.length
          ? `${project.previews.length} preview${project.previews.length === 1 ? '' : 's'}`
          : project.liveUrl
            ? 'link only'
            : 'unavailable',
      },
    ];
  }

  protected getActiveProjectPreviews(): ProjectPreview[] {
    return this.selectedProject().previews;
  }

  protected getActiveProjectPreview(): ProjectPreview | null {
    const previews = this.getActiveProjectPreviews();
    return previews[this.previewIndex()] ?? previews[0] ?? null;
  }

  protected getPreviewIndicator(): string {
    const preview = this.getActiveProjectPreview();
    const previewCount = this.getActiveProjectPreviews().length;
    if (!previewCount || !preview) {
      return 'no preview';
    }
    return `${this.previewIndex() + 1}/${previewCount} · ${preview.kind === 'artwork' ? 'artwork' : 'shot'}`;
  }

  protected getRelativeProjectOffset(index: number): number {
    const length = this.projectData.length;
    const offset = (index - this.selectedProjectIndex() + length) % length;
    return offset > length / 2 ? offset - length : offset;
  }

  protected getProjectZIndex(index: number): number {
    return 100 - 8 * Math.abs(this.getRelativeProjectOffset(index));
  }

  protected isKeyActive(code: string): boolean {
    return this.activeKeyCodes().includes(code) || this.scriptedKeyCode() === code;
  }

  protected getWireKeyCodes(): string[] {
    const scripted = this.scriptedKeyCode();
    return scripted && !this.activeKeyCodes().includes(scripted)
      ? [...this.activeKeyCodes(), scripted]
      : this.activeKeyCodes();
  }

  protected getHeldKeySummary(): string {
    const codes = this.getWireKeyCodes();
    const labels = codes.map(
      (code) => this.keyboardRows.flat().find((key) => key.code === code)?.label || code,
    );
    const visible = labels.slice(0, 3).join(' + ');
    return labels.length > 3 ? `${visible} +${labels.length - 3}` : visible || '—';
  }

  protected getKeyAnchor(code: string): { x: number; y: number } {
    return this.keyboardRows.flat().find((key) => key.code === code)?.anchor ?? { x: 650, y: 64 };
  }

  protected getPointerPlotX(): number {
    return this.pointerTelemetry().tracked
      ? Number((this.pointerTelemetry().u * 1000).toFixed(2))
      : 500;
  }

  protected getPointerPlotY(): number {
    return this.pointerTelemetry().tracked
      ? Number((this.pointerTelemetry().v * 128).toFixed(2))
      : 64;
  }

  protected getWheelTransform(index: number): string {
    const offset = this.getRelativeProjectOffset(index);
    const layout = this.wheelLayout();
    const angle = offset * layout.angleStep;
    const x = layout.baseX + layout.radius * (1 - Math.cos(angle));
    const y = layout.height / 2 + layout.radius * Math.sin(angle) - layout.cardHeight / 2;
    const scale = offset === 0 ? WHEEL_CONFIG.selectedScale : WHEEL_CONFIG.otherScale;
    const rotation = -angle / 2;
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rotation.toFixed(4)}rad) scale(${scale})`;
  }

  protected getProjectShade(index: number): string {
    const distance = Math.abs(this.getRelativeProjectOffset(index));
    return distance === 0 ? '0' : String(WHEEL_CONFIG.shade + WHEEL_CONFIG.shadeStep * distance);
  }

  protected getProjectVisibility(index: number): 'visible' | 'hidden' {
    if (!this.wheelLayoutReady()) {
      return 'hidden';
    }
    const offset = this.getRelativeProjectOffset(index);
    const layout = this.wheelLayout();
    const maxVisibleOffset = window.innerWidth <= 700 ? 1 : 2;
    if (Math.abs(offset) > maxVisibleOffset) {
      return 'hidden';
    }
    const angle = offset * layout.angleStep;
    const scale = offset === 0 ? WHEEL_CONFIG.selectedScale : WHEEL_CONFIG.otherScale;
    const rotatedHalfHeight =
      (Math.abs(layout.cardWidth * Math.sin(angle / 2)) +
        Math.abs(layout.cardHeight * Math.cos(angle / 2))) *
      scale / 2;
    const centerY = layout.height / 2 + layout.radius * Math.sin(angle);
    return centerY + rotatedHalfHeight < -layout.cardHeight ||
      centerY - rotatedHalfHeight > layout.height + layout.cardHeight
      ? 'hidden'
      : 'visible';
  }

  private logWheelBounds(): void {
    const wheel = this.wheelHost?.nativeElement;
    if (!wheel) {
      return;
    }
    const wheelRect = wheel.getBoundingClientRect();
    const overflows: Array<{
      project: string;
      index: number;
      k: number;
      overflow: string;
    }> = [];

    for (const [index, card] of Array.from(wheel.querySelectorAll<HTMLElement>('.wheel-item')).entries()) {
      const rect = card.getBoundingClientRect();
      const sides = [
        { side: 'left', px: wheelRect.left - rect.left },
        { side: 'right', px: rect.right - wheelRect.right },
        { side: 'top', px: wheelRect.top - rect.top },
        { side: 'bottom', px: rect.bottom - wheelRect.bottom },
      ].filter(({ px }) => px > 0.5);
      if (sides.length) {
        overflows.push({
          project: card.getAttribute('aria-label') ?? 'unknown',
          index,
          k: this.getRelativeProjectOffset(index),
          overflow: sides.map(({ side, px }) => `${side} ${px.toFixed(1)}px`).join(', '),
        });
      }
    }

    if (overflows.length) {
      console.warn('[wheel debug] cards outside wheel bounds', {
        wheel: { width: wheelRect.width, height: wheelRect.height },
        cards: overflows,
      });
    } else {
      console.info('[wheel debug] all card bounds inside wheel', {
        width: wheelRect.width,
        height: wheelRect.height,
      });
    }
  }

  protected selectProject(index: number): void {
    if (!this.projectData.length) {
      return;
    }
    const nextIndex = (index + this.projectData.length) % this.projectData.length;
    const project = this.projectData[nextIndex];
    this.selectedProjectIndex.set(nextIndex);
    this.selectedProject.set(project);
    this.mobileProjectMenuOpen.set(false);
    this.previewIndex.set(0);
    this.lightboxOpen.set(false);
    this.workspacePath.set(project.path);
    this.revealSelectedProject();
    this.projectCardAnimation?.cancel();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const card = document.getElementById(`project-option-${project.id}`);
        if (card && typeof card.animate === 'function' && !this.prefersReducedMotion()) {
          this.projectCardAnimation = card.animate(
            [
              { filter: 'brightness(0.88)' },
              { filter: 'brightness(1.18)' },
              { filter: 'brightness(1)' },
            ],
            { duration: 300, easing: 'ease-out' },
          );
        }
      });
    }
    this.typeTerminalEntries(this.getProjectTerminalEntries(project), true);
  }

  protected navigateProject(direction: number, moveFocus = false): void {
    const current = this.selectedProjectIndex();
    const nextIndex = (current + direction + this.projectData.length) % this.projectData.length;
    this.selectProject(nextIndex);
    if (moveFocus) {
      window.requestAnimationFrame(() => {
        document.getElementById(`project-option-${this.selectedProject().id}`)?.focus({ preventScroll: true });
      });
    }
  }

  protected onWheelItemClick(event: MouseEvent, index: number): void {
    if (this.suppressNextWheelClick && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
      this.suppressNextWheelClick = false;
      if (this.wheelClickSuppressionTimer !== null) {
        window.clearTimeout(this.wheelClickSuppressionTimer);
        this.wheelClickSuppressionTimer = null;
      }
      return;
    }
    this.selectProject(index);
  }

  protected toggleMobileProjectMenu(): void {
    const opening = !this.mobileProjectMenuOpen();
    if (opening && window.innerWidth <= 700) {
      this.wheelLayoutReady.set(false);
    }
    this.mobileProjectMenuOpen.update((isOpen) => !isOpen);
    if (this.wheelDebug()) {
      window.requestAnimationFrame(() => {
        this.measureWheelGeometry();
        window.requestAnimationFrame(() => this.logWheelBounds());
      });
    } else if (opening) {
      window.requestAnimationFrame(() => this.measureWheelGeometry());
    }
  }

  protected onWheelProjectNavigate(event: WheelEvent): void {
    if (event.deltaY === 0) {
      return;
    }
    event.preventDefault();
    if (this.wheelLocked) {
      return;
    }

    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1;
    this.wheelDelta += event.deltaY * multiplier;
    if (this.wheelDeltaResetTimer !== null) {
      window.clearTimeout(this.wheelDeltaResetTimer);
    }
    this.wheelDeltaResetTimer = window.setTimeout(() => {
      this.wheelDelta = 0;
      this.wheelDeltaResetTimer = null;
    }, 180);
    if (Math.abs(this.wheelDelta) < 48) {
      return;
    }

    this.navigateProject(this.wheelDelta > 0 ? 1 : -1);
    this.wheelDelta = 0;
    this.wheelLocked = true;
    this.wheelUnlockTimer = window.setTimeout(() => {
      this.wheelLocked = false;
      this.wheelUnlockTimer = null;
    }, 180);
  }

  protected onWheelPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.dragPointerId !== null) {
      return;
    }
    if (this.wheelClickSuppressionTimer !== null) {
      window.clearTimeout(this.wheelClickSuppressionTimer);
      this.wheelClickSuppressionTimer = null;
    }
    this.suppressNextWheelClick = false;
    this.dragPointerId = event.pointerId;
    this.dragLastY = event.clientY;
    this.dragMoved = false;
  }

  protected onWheelPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.dragPointerId) {
      return;
    }

    const delta = event.clientY - this.dragLastY;
    const threshold = Math.max(36, this.wheelLayout().height * 0.08);
    if (Math.abs(delta) < threshold) {
      return;
    }

    if (!this.dragMoved) {
      this.dragMoved = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    const stepCount = Math.min(this.projectData.length, Math.floor(Math.abs(delta) / threshold));
    const direction = delta > 0 ? -1 : 1;
    for (let step = 0; step < stepCount; step += 1) {
      this.navigateProject(direction);
    }
    this.dragLastY += Math.sign(delta) * stepCount * threshold;
  }

  protected onWheelPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.dragPointerId) {
      return;
    }
    this.dragPointerId = null;
    this.suppressNextWheelClick = this.dragMoved;
    if (this.wheelClickSuppressionTimer !== null) {
      window.clearTimeout(this.wheelClickSuppressionTimer);
      this.wheelClickSuppressionTimer = null;
    }
    if (this.suppressNextWheelClick) {
      this.wheelClickSuppressionTimer = window.setTimeout(() => {
        this.suppressNextWheelClick = false;
        this.wheelClickSuppressionTimer = null;
      }, 0);
    }
    this.dragMoved = false;
  }

  protected previousPreview(): void {
    const count = this.getActiveProjectPreviews().length;
    if (!count) {
      return;
    }
    this.previewIndex.set((this.previewIndex() + count - 1) % count);
  }

  protected nextPreview(): void {
    const count = this.getActiveProjectPreviews().length;
    if (!count) {
      return;
    }
    this.previewIndex.set((this.previewIndex() + 1) % count);
  }

  protected selectPreview(index: number): void {
    if (index >= 0 && index < this.getActiveProjectPreviews().length) {
      this.previewIndex.set(index);
    }
  }

  protected openLightbox(event: Event): void {
    if (!this.getActiveProjectPreviews().length) {
      return;
    }
    this.lightboxReturnFocus = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.lightboxOpen.set(true);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.lightbox-close')?.focus();
    });
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
    window.requestAnimationFrame(() => this.lightboxReturnFocus?.focus());
    this.lightboxReturnFocus = null;
  }

  protected onPreviewPointerMove(event: PointerEvent): void {
    const frame = event.currentTarget;
    if (!(frame instanceof HTMLElement) || event.pointerType === 'touch') {
      return;
    }

    const bounds = frame.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }

    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    frame.style.setProperty('--preview-x', `${x}%`);
    frame.style.setProperty('--preview-y', `${y}%`);
    frame.style.setProperty('--preview-tilt-x', `${((50 - y) / 50) * 2}deg`);
    frame.style.setProperty('--preview-tilt-y', `${((x - 50) / 50) * 2.5}deg`);
  }

  protected onPreviewPointerLeave(event: PointerEvent): void {
    const frame = event.currentTarget;
    if (!(frame instanceof HTMLElement)) {
      return;
    }

    frame.style.removeProperty('--preview-x');
    frame.style.removeProperty('--preview-y');
    frame.style.removeProperty('--preview-tilt-x');
    frame.style.removeProperty('--preview-tilt-y');
  }

  protected openCv(event: Event): void {
    this.cvReturnFocus = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.cvSlide.set('resume');
    this.cvOpen.set(true);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.cv-close')?.focus();
    });
  }

  protected closeCv(): void {
    this.cvOpen.set(false);
    window.requestAnimationFrame(() => this.cvReturnFocus?.focus());
    this.cvReturnFocus = null;
  }

  protected selectCvSlide(slide: CvSlide): void {
    this.cvSlide.set(slide);
  }

  protected getCertificateAsset(file: string): string {
    return `certificates/${encodeURIComponent(file)}`;
  }

  protected getIntroCommandEditor(): string {
    return this.introCommand.slice(0, Math.min(this.introTypedLength(), 2));
  }

  protected getIntroCommandPath(): string {
    return this.introCommand.slice(2, this.introTypedLength());
  }

  protected skipIntro(): void {
    if (!this.introActive()) {
      return;
    }
    this.completeIntro();
  }

  private moveCvSlide(direction: 1 | -1): void {
    const currentIndex = this.cvSlides.findIndex((slide) => slide.id === this.cvSlide());
    const nextIndex = (currentIndex + direction + this.cvSlides.length) % this.cvSlides.length;
    const nextSlide = this.cvSlides[nextIndex];
    this.cvSlide.set(nextSlide.id);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`.cv-tab[data-slide="${nextSlide.id}"]`)?.focus();
    });
  }

  protected cycleTheme(direction: 1 | -1): void {
    const currentIndex = this.themeNames.indexOf(this.activeTheme());
    const nextIndex = (currentIndex + direction + this.themeNames.length) % this.themeNames.length;
    this.switchTheme(this.themeNames[nextIndex]);
  }

  protected switchTheme(theme: ThemeName): void {
    this.activeTheme.set(theme);
    this.applyTheme(theme);
    window.requestAnimationFrame(() => this.workspaceEffects?.recolor());
  }

  protected onTerminalInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.terminalInput.set(target.value);
    this.terminalHistoryIndex.set(null);
    this.terminalDraft = target.value;
    this.updateTypingTarget();
  }

  protected focusTerminal(): void {
    this.focusMode.set('terminal');
  }

  protected onTerminalBlur(): void {
    this.scheduleTypingTargetUpdate();
  }

  protected updateTypingTarget(): void {
    const input = this.commandInput?.nativeElement;
    if (input && document.activeElement === input && input.value.length > 0) {
      const inputTarget = this.getCommandInputCaret(input);
      if (inputTarget) {
        this.workspaceEffects?.setTypingTarget(inputTarget);
        return;
      }
    }

    if (this.terminalTyping()) {
      const outputTarget = this.getTerminalOutputCaret();
      if (outputTarget) {
        this.workspaceEffects?.setTypingTarget(outputTarget);
        return;
      }
    }
    this.workspaceEffects?.setTypingTarget(null);
  }

  protected focusWheel(): void {
    this.focusMode.set('wheel');
  }

  protected focusProjectPane(): void {
    this.focusMode.set('pane');
  }

  protected onTerminalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.focusSelectedProject();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateTerminalHistory(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateTerminalHistory(1);
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    const input = this.terminalInput().trim();
    if (!input) {
      return;
    }

    this.finishTerminalTyping();
    const commandPath = this.workspacePath();
    const previousProject = this.selectedProject();
    const results = this.executeCommand(input);
    const commandEntries: TerminalEntry[] = [
      { kind: 'system', text: `masato@portfolio ${commandPath}` },
      { kind: 'command', text: `› ${input}` },
    ];
    if (this.selectedProject() !== previousProject) {
      this.typeTerminalEntries([
        ...commandEntries,
        ...results,
        ...this.getProjectTerminalEntries(this.selectedProject()).slice(2),
      ], true);
    } else {
      this.appendTerminalEntries(commandEntries);
      this.typeTerminalEntries(results, false);
    }
    this.terminalHistory.update((history) => [...history, input]);
    this.terminalHistoryIndex.set(null);
    this.terminalInput.set('');
    this.terminalDraft = '';
    this.scheduleTypingTargetUpdate();
    this.scrollTerminalToEnd();
  }

  protected executeCommand(rawInput: string): TerminalEntry[] {
    const input = rawInput.trim();
    if (!input) {
      return [];
    }

    const [command, ...args] = input.split(/\s+/);
    const normalizedCommand = command.toLowerCase();
    const target = args.join(' ').trim();

    if (normalizedCommand === 'help') {
      return [{
        kind: 'output',
        text: ['whoami', 'fetch shokomori', 'ls [links/]', 'pwd', ':e <project-path>', ':Git', ':theme <name>'].join('\n'),
      }];
    }
    if (normalizedCommand === 'whoami') {
      return [{ kind: 'output', text: 'Masato Martin\nGitHub: shokomori' }];
    }
    if (normalizedCommand === 'fetch') {
      if (target && target.toLowerCase() !== 'shokomori') {
        return [{ kind: 'error', text: `No portfolio profile found for ${target}.` }];
      }
      return [{
        kind: 'output',
        text: `Masato Martin\nprojects ${this.projectData.length}\ngithub github.com/shokomori`,
      }];
    }
    if (normalizedCommand === 'pwd') {
      return [{ kind: 'output', text: this.workspacePath() }];
    }
    if (normalizedCommand === 'ls') {
      if (target === 'links/' || target === 'links') {
        return [{ kind: 'output', text: 'github  https://github.com/shokomori' }];
      }
      if (target && target !== '~/Projects' && target !== '.') {
        return [{ kind: 'error', text: `No portfolio directory named ${target}.` }];
      }
      return [{
        kind: 'output',
        text: this.projectData.map((project) => `${project.id}/`).join('  '),
      }];
    }
    if (normalizedCommand === ':e') {
      return this.handleEditorCommand(args);
    }
    if (normalizedCommand === ':git') {
      const repositoryUrl = this.selectedProject().repositoryUrl;
      return repositoryUrl
        ? [{ kind: 'output', text: `origin ${repositoryUrl}` }]
        : [{ kind: 'error', text: `No repository is linked for ${this.selectedProject().title}.` }];
    }
    if (normalizedCommand === ':theme') {
      return this.handleThemeCommand(args);
    }

    return [{ kind: 'error', text: `command not found: ${command}. Type "help" to list workspace commands.` }];
  }

  private measureWheelGeometry(): void {
    const wheel = this.wheelHost?.nativeElement;
    if (!wheel) {
      return;
    }
    const rect = wheel.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const styles = window.getComputedStyle(wheel);
    const readNumber = (property: string, fallback: number): number => {
      const value = Number.parseFloat(styles.getPropertyValue(property));
      return Number.isFinite(value) ? value : fallback;
    };
    const cardWidth = readNumber('--wheel-card-width', WHEEL_CONFIG.cardWidth);
    const cardHeight = readNumber('--wheel-card-height', WHEEL_CONFIG.cardHeight);
    const isMobileDrawer = window.innerWidth <= 700 && this.mobileProjectMenuOpen();
    const baseX = isMobileDrawer
      ? Math.max(0, (rect.width - cardWidth) / 2)
      : WHEEL_CONFIG.baseX;
    const maxVisibleOffset = isMobileDrawer ? 1 : 2;
    const angleStep = isMobileDrawer ? WHEEL_CONFIG.mobileAngleStep : WHEEL_CONFIG.angleStep;
    let radius: number = WHEEL_CONFIG.radius;

    for (let offset = -maxVisibleOffset; offset <= maxVisibleOffset; offset += 1) {
      const angle = offset * angleStep;
      const scale = offset === 0 ? WHEEL_CONFIG.selectedScale : WHEEL_CONFIG.otherScale;
      const halfWidth =
        (Math.abs(cardWidth * Math.cos(angle / 2)) +
          Math.abs(cardHeight * Math.sin(angle / 2))) *
        scale / 2;
      const halfHeight =
        (Math.abs(cardWidth * Math.sin(angle / 2)) +
          Math.abs(cardHeight * Math.cos(angle / 2))) *
        scale / 2;
      const xTravel = 1 - Math.cos(angle);
      const yTravel = Math.abs(Math.sin(angle));
      if (xTravel > 0) {
        radius = Math.min(
          radius,
          (rect.width - baseX - cardWidth / 2 - halfWidth - 2) / xTravel,
        );
      }
      if (yTravel > 0) {
        radius = Math.min(radius, (rect.height / 2 - halfHeight - 2) / yTravel);
      }
    }

    this.wheelLayout.set({
      width: rect.width,
      height: rect.height,
      cardWidth,
      cardHeight,
      radius: Math.max(0, radius),
      angleStep,
      baseX,
    });
    this.wheelLayoutReady.set(true);
    this.drawWheelInk();
  }

  private drawWheelInk(): void {
    const canvas = this.wheelInk?.nativeElement;
    const layout = this.wheelLayout();
    if (!canvas || layout.width === 0 || layout.height === 0) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, WHEEL_CONFIG.maxDpr);
    const canvasWidth = layout.width + WHEEL_CONFIG.leftBleed;
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(layout.height * dpr);
    if (typeof CanvasRenderingContext2D === 'undefined') {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvasWidth, layout.height);
    context.strokeStyle = window.getComputedStyle(this.wheelHost!.nativeElement).getPropertyValue('--dim').trim();
    context.lineWidth = 1;
    context.globalAlpha = 0.6;

    const centerX = layout.baseX + layout.radius + layout.cardWidth / 2 + WHEEL_CONFIG.leftBleed;
    const centerY = layout.height / 2;
    const maxVisibleOffset = window.innerWidth <= 700 ? 1 : 2;
    context.beginPath();
    for (let step = 0; step <= 96; step += 1) {
      const angle = ((step / 96) * 2 - 1) * maxVisibleOffset * layout.angleStep;
      const x = centerX - layout.radius * Math.cos(angle);
      const y = centerY + layout.radius * Math.sin(angle);
      if (step === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
    for (let offset = -maxVisibleOffset; offset <= maxVisibleOffset; offset += 1) {
      const angle = offset * layout.angleStep;
      const x = centerX - layout.radius * Math.cos(angle);
      const y = centerY + layout.radius * Math.sin(angle);
      context.beginPath();
      context.moveTo(x - 3, y);
      context.lineTo(x + 3, y);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  private updatePointerTelemetry(x: number, y: number, type: string): void {
    this.pointerPosition = { x, y, type };
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const next: PointerTelemetry = {
      x: Math.round(x),
      y: Math.round(y),
      u: Math.round(Math.max(0, Math.min(1, x / viewportWidth)) * 1000) / 1000,
      v: Math.round(Math.max(0, Math.min(1, y / viewportHeight)) * 1000) / 1000,
      type,
      tracked: true,
    };
    const current = this.pointerTelemetry();
    if (
      current.x === next.x &&
      current.y === next.y &&
      current.u === next.u &&
      current.v === next.v &&
      current.type === next.type
    ) {
      return;
    }
    this.pointerTelemetry.set(next);
  }

  private setPointerButtons(buttonMask: number): void {
    const buttons = [0, 1, 2].filter((button) => (buttonMask & (1 << button)) !== 0);
    const current = this.pointerButtons();
    if (current.length === buttons.length && current.every((button, index) => button === buttons[index])) {
      return;
    }
    this.pointerButtons.set(buttons);
  }

  private getKeyCodeFromKey(key: string): string {
    if (key.length === 1 && /[a-z]/i.test(key)) {
      return `Key${key.toUpperCase()}`;
    }
    if (key.length === 1 && /[0-9]/.test(key)) {
      return `Digit${key}`;
    }
    if (key === ' ') {
      return 'Space';
    }
    const aliases: Record<string, string> = {
      Esc: 'Escape',
      Left: 'ArrowLeft',
      Right: 'ArrowRight',
      Up: 'ArrowUp',
      Down: 'ArrowDown',
      Control: 'ControlLeft',
      Shift: 'ShiftLeft',
      Alt: 'AltLeft',
      Meta: 'MetaLeft',
    };
    return aliases[key] ?? key;
  }

  private revealSelectedProject(): void {
    const pane = this.projectPane?.nativeElement;
    if (!pane || typeof pane.animate !== 'function' || this.prefersReducedMotion()) {
      return;
    }

    this.projectRevealAnimation?.cancel();
    this.projectRevealAnimation = pane.animate(
      [
        { clipPath: 'inset(0 100% 0 0)', opacity: 0.48 },
        { clipPath: 'inset(0 0 0 0)', opacity: 1 },
      ],
      { duration: 420, easing: 'cubic-bezier(0.2, 0.72, 0.24, 1)' },
    );
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private startIntro(): void {
    if (this.introStarted || this.prefersReducedMotion()) {
      return;
    }
    const replayRequested = new URLSearchParams(window.location.search).get('intro') === '1';
    if (!replayRequested && window.sessionStorage.getItem('masato-portfolio-intro-seen') === '1') {
      return;
    }

    this.introStarted = true;
    this.introActive.set(true);
    this.introStage.set('monogram');
    window.sessionStorage.setItem('masato-portfolio-intro-seen', '1');
    this.scheduleIntroStep(() => {
      this.introStage.set('boot');
      this.introLogLines.set(1);
      this.revealIntroLogLine();
    }, 280);
  }

  private revealIntroLogLine(): void {
    if (this.introLogLines() < this.introMessages.length) {
      this.scheduleIntroStep(() => {
        this.introLogLines.update((count) => count + 1);
        this.revealIntroLogLine();
      }, 110);
      return;
    }

    this.scheduleIntroStep(() => {
      this.introStage.set('editor');
      this.scheduleIntroStep(() => {
        this.introStage.set('typing');
        this.typeIntroCharacter();
      }, 220);
    }, 110);
  }

  private typeIntroCharacter(): void {
    if (this.introTypedLength() >= this.introCommand.length) {
      this.introStage.set('handoff');
      this.scheduleIntroStep(() => this.completeIntro(), 260);
      return;
    }

    this.introTypedLength.update((length) => length + 1);
    this.scheduleIntroStep(() => this.typeIntroCharacter(), 24);
  }

  private scheduleIntroStep(callback: () => void, delay: number): void {
    if (this.introTimer !== null) {
      window.clearTimeout(this.introTimer);
    }
    this.introTimer = window.setTimeout(() => {
      this.introTimer = null;
      callback();
    }, delay);
  }

  private completeIntro(): void {
    if (!this.introActive()) {
      return;
    }
    if (this.introTimer !== null) {
      window.clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    this.introStage.set('complete');
    this.introActive.set(false);
    this.typeTerminalEntries(this.getProjectTerminalEntries(this.selectedProject()), true);
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    );
  }

  private appendTerminalEntries(entries: TerminalEntry[]): void {
    this.terminalEntries.update((current) => [...current, ...entries].slice(-100));
  }

  private typeTerminalEntries(entries: TerminalEntry[], replace: boolean): void {
    if (this.terminalTypingTimer !== null) {
      window.clearTimeout(this.terminalTypingTimer);
      this.terminalTypingTimer = null;
    }
    this.terminalTypingQueue = [];
    this.terminalTypingCurrent = null;
    this.terminalTypingPosition = 0;

    if (replace) {
      this.terminalEntries.set([]);
    }

    if (this.introActive()) {
      return;
    }

    if (
      typeof window === 'undefined' ||
      this.prefersReducedMotion() ||
      (typeof document !== 'undefined' && document.visibilityState === 'hidden')
    ) {
      this.appendTerminalEntries(entries);
      this.terminalTyping.set(false);
      this.workspaceEffects?.setAutoTyping(false);
      this.scrollTerminalToEnd();
      return;
    }

    this.terminalTypingQueue.push(...entries);
    if (this.terminalTypingQueue.length === 0) {
      this.terminalTyping.set(false);
      this.workspaceEffects?.setAutoTyping(false);
      return;
    }

    this.terminalTyping.set(true);
    this.workspaceEffects?.setAutoTyping(true);
    this.revealNextTerminalCharacter();
  }

  private revealNextTerminalCharacter(): void {
    if (this.terminalTypingCurrent === null) {
      this.terminalTypingCurrent = this.terminalTypingQueue.shift() ?? null;
      this.terminalTypingPosition = 0;
      if (this.terminalTypingCurrent === null) {
        this.terminalTyping.set(false);
        this.workspaceEffects?.setAutoTyping(false);
        this.workspaceEffects?.setUpcoming('');
        this.scheduleTypingTargetUpdate();
        this.terminalTypingTimer = null;
        this.scrollTerminalToEnd();
        return;
      }
      this.terminalEntries.update((current) => [
        ...current,
        {
          kind: this.terminalTypingCurrent!.kind,
          text: '',
          href: this.terminalTypingCurrent!.href,
        },
      ].slice(-100));
      this.scheduleTypingTargetUpdate();
    }

    const entry = this.terminalTypingCurrent;
    if (!entry) {
      return;
    }
    if (this.terminalTypingPosition >= entry.text.length) {
      this.terminalTypingCurrent = null;
      this.scrollTerminalToEnd();
      this.terminalTypingTimer = window.setTimeout(() => this.revealNextTerminalCharacter(), 70);
      return;
    }

    const character = entry.text[this.terminalTypingPosition++];
    this.showScriptedKey(character);
    this.workspaceEffects?.setUpcoming([
      entry.text.slice(this.terminalTypingPosition),
      ...this.terminalTypingQueue.map((queued) => queued.text),
    ].join('\n'));
    this.terminalEntries.update((current) => {
      const lastIndex = current.length - 1;
      const lastEntry = current[lastIndex];
      if (!lastEntry) {
        return current;
      }
      const next = [...current];
      next[lastIndex] = { ...lastEntry, text: lastEntry.text + character };
      return next;
    });
    this.scheduleTypingTargetUpdate();
    if (character === '\n' || this.terminalTypingPosition % 12 === 0) {
      this.scrollTerminalToEnd();
    }
    const delay = entry.kind === 'output' ? 8 : 12;
    this.terminalTypingTimer = window.setTimeout(() => this.revealNextTerminalCharacter(), delay);
  }

  private finishTerminalTyping(): void {
    if (this.terminalTypingTimer !== null) {
      window.clearTimeout(this.terminalTypingTimer);
      this.terminalTypingTimer = null;
    }

    if (this.terminalTypingCurrent) {
      const currentEntry = this.terminalTypingCurrent;
      this.terminalEntries.update((entries) => {
        const lastIndex = entries.length - 1;
        if (lastIndex < 0) {
          return [...entries, currentEntry];
        }
        const next = [...entries];
        next[lastIndex] = currentEntry;
        return next;
      });
    }
    const completed = this.terminalTypingQueue;
    this.terminalTypingCurrent = null;
    this.terminalTypingQueue = [];
    this.terminalTypingPosition = 0;
    this.appendTerminalEntries(completed);
    this.terminalTyping.set(false);
    this.workspaceEffects?.setAutoTyping(false);
    this.workspaceEffects?.setUpcoming('');
    this.scheduleTypingTargetUpdate();
    if (this.scriptedKeyTimer !== null) {
      window.clearTimeout(this.scriptedKeyTimer);
      this.scriptedKeyTimer = null;
    }
    this.scriptedKeyCode.set(null);
  }

  private scheduleTypingTargetUpdate(): void {
    if (this.typingTargetFrame !== null) {
      return;
    }
    this.typingTargetFrame = window.requestAnimationFrame(() => {
      this.typingTargetFrame = null;
      this.updateTypingTarget();
    });
  }

  private getCommandInputCaret(input: HTMLInputElement): { x: number; y: number } | null {
    const bounds = input.getBoundingClientRect();
    const styles = window.getComputedStyle(input);
    const caretIndex = input.selectionStart ?? input.value.length;
    const textBeforeCaret = input.value.slice(0, caretIndex);
    const fontSize = Number.parseFloat(styles.fontSize) || 12;
    const letterSpacing = Number.parseFloat(styles.letterSpacing) || 0;
    let textWidth = textBeforeCaret.length * fontSize * 0.6;
    if (typeof window.CanvasRenderingContext2D !== 'undefined') {
      const context = document.createElement('canvas').getContext('2d');
      if (context) {
        context.font = styles.font;
        textWidth = context.measureText(textBeforeCaret).width;
      }
    }
    textWidth += Math.max(0, textBeforeCaret.length - 1) * letterSpacing;

    const left = bounds.left + input.clientLeft + (Number.parseFloat(styles.paddingLeft) || 0) - input.scrollLeft;
    return {
      x: Math.max(bounds.left, Math.min(bounds.right, left + textWidth)),
      y: bounds.top + bounds.height / 2,
    };
  }

  private getTerminalOutputCaret(): { x: number; y: number } | null {
    const output = this.terminalOutput?.nativeElement;
    const line = output?.lastElementChild;
    if (!(line instanceof HTMLElement)) {
      return null;
    }
    const range = document.createRange();
    range.selectNodeContents(line);
    range.collapse(false);
    const rangeBounds = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
    const bounds = rangeBounds && (rangeBounds.width > 0 || rangeBounds.height > 0)
      ? rangeBounds
      : line.getBoundingClientRect();
    return { x: bounds.right, y: bounds.top + bounds.height / 2 };
  }

  private showScriptedKey(character: string): void {
    if (this.scriptedKeyTimer !== null) {
      window.clearTimeout(this.scriptedKeyTimer);
      this.scriptedKeyTimer = null;
    }
    const code = this.getKeyCodeForCharacter(character);
    this.scriptedKeyCode.set(code);
    if (code) {
      const shifted = /[A-Z!@#$%^&*()_+:{|}<>?~"]/.test(character);
      if (shifted) {
        const shiftCode = this.getKeyCodeForCharacter(character) && this.isRightHandCode(code)
          ? 'ShiftLeft'
          : 'ShiftRight';
        this.workspaceEffects?.pressKey(shiftCode);
      }
      this.workspaceEffects?.pressKey(code);
    }
    this.scriptedKeyTimer = window.setTimeout(() => {
      this.scriptedKeyCode.set(null);
      this.scriptedKeyTimer = null;
    }, 58);
  }

  private getKeyCodeForCharacter(character: string): string | null {
    if (/[a-z]/i.test(character)) {
      return `Key${character.toUpperCase()}`;
    }
    if (/[0-9]/.test(character)) {
      return `Digit${character}`;
    }
    const symbols: Record<string, string> = {
      ' ': 'Space',
      '\n': 'Enter',
      '.': 'Period',
      ',': 'Comma',
      ':': 'Semicolon',
      ';': 'Semicolon',
      '/': 'Slash',
      '-': 'Minus',
      '_': 'Minus',
      '=': 'Equal',
      '\'': 'Quote',
      '"': 'Quote',
      '`': 'Backquote',
      '~': 'Backquote',
      '[': 'BracketLeft',
      ']': 'BracketRight',
      '\\': 'Backslash',
      '>': 'Period',
      '<': 'Comma',
      '+': 'Equal',
      '{': 'BracketLeft',
      '}': 'BracketRight',
      '|': 'Backslash',
      '?': 'Slash',
      '!': 'Digit1',
      '@': 'Digit2',
      '#': 'Digit3',
      '$': 'Digit4',
      '%': 'Digit5',
      '^': 'Digit6',
      '&': 'Digit7',
      '*': 'Digit8',
      '(': 'Digit9',
      ')': 'Digit0',
    };
    return symbols[character] ?? null;
  }

  private isRightHandCode(code: string): boolean {
    return ['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace',
      'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash',
      'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter', 'KeyN', 'KeyM',
      'Comma', 'Period', 'Slash', 'ShiftRight', 'Space'].includes(code);
  }

  private scrollTerminalToEnd(): void {
    window.requestAnimationFrame(() => {
      const output = this.terminalOutput?.nativeElement;
      if (output) {
        output.scrollTop = output.scrollHeight;
      }
    });
  }

  private activateProject(): void {
    this.projectPane?.nativeElement.focus({ preventScroll: true });
  }

  private focusSelectedProject(): void {
    const selectedOption = document.getElementById(`project-option-${this.selectedProject().id}`);
    selectedOption?.focus({ preventScroll: true });
  }

  private handleThemeCommand(args: string[]): TerminalEntry[] {
    const requested = args[0]?.toLowerCase();
    if (!requested) {
      return [{ kind: 'error', text: `Usage: :theme <${this.themeNames.join('|')}>` }];
    }

    const nextTheme = this.themeNames.find((theme) => theme === requested);
    if (!nextTheme) {
      return [{ kind: 'error', text: `Theme not available: ${requested}.` }];
    }

    this.switchTheme(nextTheme);
    return [{ kind: 'output', text: `theme ${nextTheme}` }];
  }

  private handleEditorCommand(args: string[]): TerminalEntry[] {
    const target = args.join(' ').trim();
    if (!target) {
      return [{ kind: 'error', text: 'Usage: :e ~/Projects/<project>' }];
    }

    const normalized = target.replace(/\/+$/, '').trim();
    const projectPath = normalized.startsWith('~/Projects/')
      ? normalized.slice('~/Projects/'.length)
      : normalized;

    const match = this.projectData.find(
      (project) =>
        project.id.toLowerCase() === projectPath.toLowerCase() ||
        project.title.toLowerCase() === projectPath.toLowerCase(),
    );

    if (!match || !normalized.startsWith('~/Projects/')) {
      return [{ kind: 'error', text: `No project at ${normalized}.` }];
    }

    this.selectProject(this.projectData.indexOf(match));
    return [{ kind: 'output', text: this.workspacePath() }];
  }

  private getProjectTerminalEntries(project = this.selectedProject()): TerminalEntry[] {
    return [
      { kind: 'system', text: `masato@portfolio ${project.path}` },
      { kind: 'command', text: `› fetch ${project.id}` },
      { kind: 'output', text: project.title },
      { kind: 'output', text: project.description },
      ...this.getProjectBufferLines(project).map((line) => ({
        kind: 'output' as const,
        text: `${line.label}: ${line.value}`,
        href: line.href,
      })),
    ];
  }

  private navigateTerminalHistory(direction: -1 | 1): void {
    const history = this.terminalHistory();
    if (!history.length) {
      return;
    }

    const currentIndex = this.terminalHistoryIndex();
    if (direction === -1) {
      if (currentIndex === null) {
        this.terminalDraft = this.terminalInput();
        this.terminalHistoryIndex.set(history.length - 1);
      } else {
        this.terminalHistoryIndex.set(Math.max(0, currentIndex - 1));
      }
      this.terminalInput.set(history[this.terminalHistoryIndex() ?? history.length - 1]);
      return;
    }

    if (currentIndex === null) {
      return;
    }
    if (currentIndex >= history.length - 1) {
      this.terminalHistoryIndex.set(null);
      this.terminalInput.set(this.terminalDraft);
      return;
    }
    const nextIndex = currentIndex + 1;
    this.terminalHistoryIndex.set(nextIndex);
    this.terminalInput.set(history[nextIndex]);
  }

  private resolveStoredTheme(): ThemeName {
    if (typeof window === 'undefined') {
      return 'black';
    }

    const saved = window.localStorage.getItem('portfolio-theme');
    if (saved && this.themeNames.includes(saved as ThemeName)) {
      return saved as ThemeName;
    }

    return 'black';
  }

  private applyTheme(theme: ThemeName): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('portfolio-theme', theme);
      window.requestAnimationFrame(() => this.drawWheelInk());
    }
  }
}
