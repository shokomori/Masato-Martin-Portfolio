import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App workspace interactions', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function createWorkspace() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  async function waitForTerminalText(
    fixture: ComponentFixture<App>,
    text: string,
    timeout = 10000,
  ): Promise<void> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      fixture.detectChanges();
      if (fixture.nativeElement.querySelector('.terminal-output')?.textContent?.includes(text)) {
        return;
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    }
    throw new Error(`Terminal output did not reveal "${text}".`);
  }

  async function waitForTerminalTextCount(
    fixture: ComponentFixture<App>,
    text: string,
    minimumCount: number,
    timeout = 10000,
  ): Promise<void> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      fixture.detectChanges();
      const output = fixture.nativeElement.querySelector('.terminal-output')?.textContent ?? '';
      if (output.split(text).length - 1 >= minimumCount) {
        return;
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    }
    throw new Error(`Terminal output did not reveal "${text}" ${minimumCount} times.`);
  }

  function selectedProject(element: HTMLElement): string | null {
    return element.querySelector('.wheel-item[aria-selected="true"]')?.getAttribute('aria-label') ?? null;
  }

  function normalizedText(element: Element | null): string {
    return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function latestTerminalError(element: HTMLElement): string {
    const errors = element.querySelectorAll('.terminal-line.kind-error');
    return normalizedText(errors.item(errors.length - 1));
  }

  function runCommand(element: HTMLElement, command: string): HTMLInputElement {
    const input = element.querySelector<HTMLInputElement>('#workspace-command');
    if (!input) {
      throw new Error('Terminal input was not rendered.');
    }
    input.value = command;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    return input;
  }

  it('hands off from the one-time terminal intro and never replays on project or theme changes', async () => {
    window.sessionStorage.removeItem('masato-portfolio-intro-seen');
    window.history.replaceState(null, '', window.location.pathname);
    const { fixture, element } = createWorkspace();

    expect(element.querySelector('.portfolio-intro')?.getAttribute('data-stage')).toBe('monogram');
    expect(element.querySelector('main.stage')?.hasAttribute('inert')).toBe(true);

    element.querySelector<HTMLButtonElement>('.intro-skip')?.click();
    fixture.detectChanges();
    expect(element.querySelector('.portfolio-intro')).toBeNull();
    expect(element.querySelector('main.stage')?.hasAttribute('inert')).toBe(false);

    element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="VoxFilter"]')?.click();
    element.querySelector<HTMLButtonElement>('.den')?.click();
    fixture.detectChanges();
    expect(selectedProject(element)).toBe('VoxFilter');
    expect(element.querySelector('.portfolio-intro')).toBeNull();

    fixture.destroy();
  });

  it('completes the intro automatically and starts the existing project terminal typing', async () => {
    window.sessionStorage.removeItem('masato-portfolio-intro-seen');
    window.history.replaceState(null, '', window.location.pathname);
    const { fixture, element } = createWorkspace();

    await waitForTerminalText(fixture, 'preview: 3 previews', 8000);
    fixture.detectChanges();
    expect(element.querySelector('.portfolio-intro')).toBeNull();
    expect(element.querySelector('main.stage')?.hasAttribute('inert')).toBe(false);
    expect(normalizedText(element.querySelector('.terminal-output'))).toContain('Lorekeeper');
    fixture.destroy();
  }, 12000);

  it('renders the data-driven workspace with real Lorekeeper screenshots', async () => {
    const { fixture, element } = createWorkspace();
    await waitForTerminalText(fixture, 'preview: 3 previews');
    fixture.detectChanges();

    expect(element.querySelectorAll('.wheel-item').length).toBe(13);
    expect(selectedProject(element)).toBe('Lorekeeper');
    expect(normalizedText(element.querySelector('.winbar'))).toBe('fish — ~/Projects/lorekeeper');
    expect(normalizedText(element.querySelector('.terminal-output'))).toContain('Lorekeeper');
    expect(normalizedText(element.querySelector('.buffer'))).toContain('preview: 3 previews');
    expect(element.querySelector('.buffer a')?.getAttribute('href')).toBe('https://github.com/shokomori/Lorekeeper');
    expect(element.querySelectorAll('.buffer a').length).toBe(2);
    expect(element.querySelector('.wheel-item[aria-label="Lorekeeper"] img')?.getAttribute('src')).toBe(
      'previews/lorekeeper-landing-cover.jpg',
    );
    expect(element.querySelectorAll('.shot .frame img').length).toBe(3);
    expect(element.querySelector('.shot .frame img.is-current')?.getAttribute('alt')).toContain(
      'Lorekeeper campaign landing page',
    );
    expect(element.querySelectorAll('.shot-index').length).toBe(3);

    fixture.destroy();
  }, 15000);

  it('crossfades between genuine screenshots and opens the selected image in the large viewer', async () => {
    const { fixture, element } = createWorkspace();
    await waitForTerminalText(fixture, 'preview: 3 previews');
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.shot-index[aria-label^="Campaign dashboard"]')?.click();
    fixture.detectChanges();
    expect(element.querySelector('.shot .frame img.is-current')?.getAttribute('src')).toBe(
      'previews/lorekeeper-dashboard-empty.jpg',
    );
    expect(element.querySelector('.shot figcaption')?.textContent).toContain('Campaign dashboard');

    element.querySelector<HTMLButtonElement>('.shot .frame')?.click();
    fixture.detectChanges();
    expect(element.querySelector('.lightbox img')?.getAttribute('src')).toBe(
      'previews/lorekeeper-dashboard-empty.jpg',
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('.lightbox img')?.getAttribute('src')).toBe('previews/lorekeeper-sessions.jpg');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('.lightbox')).toBeNull();
    fixture.destroy();
  }, 15000);

  it('shows the published Bataan Campus Finder screenshot and its live project link', async () => {
    const { fixture, element } = createWorkspace();
    element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="Bataan Campus Finder"]')?.click();
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'preview: 1 preview');
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('Bataan Campus Finder');
    expect(element.querySelector('.buffer a[href="https://shokomori.github.io/Bataan-Campus-Finder/"]')?.getAttribute('href')).toBe(
      'https://shokomori.github.io/Bataan-Campus-Finder/',
    );
    expect(element.querySelector('.shot .frame img.is-current')?.getAttribute('src')).toBe(
      'previews/bataan-campus-finder.png',
    );
    fixture.destroy();
  }, 15000);

  it('provides a visual preview for every listed project', async () => {
    const { fixture, element } = createWorkspace();
    await waitForTerminalText(fixture, 'preview: 3 previews');

    const projects = Array.from(element.querySelectorAll<HTMLButtonElement>('.wheel-item'));
    expect(projects).toHaveLength(13);

    for (const project of projects) {
      project.click();
      fixture.detectChanges();
      const preview = element.querySelector<HTMLImageElement>('.shot .frame img.is-current');
      expect(preview?.getAttribute('src'), project.getAttribute('aria-label') ?? 'project preview').toMatch(
        /^previews\//,
      );
      expect(preview?.getAttribute('alt')).toBeTruthy();
    }

    fixture.destroy();
  }, 20000);

  it('tracks pointer position over a preview and clears the effect on leave', () => {
    const { fixture, element } = createWorkspace();
    const frame = element.querySelector<HTMLButtonElement>('.shot .frame');
    if (!frame) {
      throw new Error('Project preview frame was not rendered.');
    }
    frame.getBoundingClientRect = () => new DOMRect(10, 20, 200, 100);

    frame.dispatchEvent(new MouseEvent('pointermove', { clientX: 160, clientY: 45 }));
    expect(frame.style.getPropertyValue('--preview-x')).toBe('75%');
    expect(frame.style.getPropertyValue('--preview-y')).toBe('25%');

    frame.dispatchEvent(new Event('pointerleave'));
    expect(frame.style.getPropertyValue('--preview-x')).toBe('');
    expect(frame.style.getPropertyValue('--preview-tilt-y')).toBe('');
    fixture.destroy();
  });

  it('opens the CV pop-out with whoami, certifications, and PDF slides', () => {
    const { fixture, element } = createWorkspace();

    element.querySelector<HTMLButtonElement>('.cv-launch')?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"][aria-labelledby="cv-title"]')).not.toBeNull();
    expect(element.querySelector('.cv-resume iframe')?.getAttribute('src')).toBe('masato_cv_v3.pdf');
    expect(element.querySelector('.cv-open-pdf')?.getAttribute('href')).toBe('masato_cv_v3.pdf');

    element.querySelector<HTMLButtonElement>('.cv-tab[data-slide="whoami"]')?.click();
    fixture.detectChanges();
    expect(normalizedText(element.querySelector('.cv-whoami'))).toContain('B.S. Computer Science');
    expect(normalizedText(element.querySelector('.cv-whoami'))).toContain('Holy Angel University');
    expect(normalizedText(element.querySelector('.cv-whoami'))).toContain('Build with AI Hackathon');

    element.querySelector<HTMLButtonElement>('.cv-tab[data-slide="certifications"]')?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.cv-certificate').length).toBe(28);
    expect(element.querySelector('.cv-certificate')?.getAttribute('href')).toContain(
      'certificates/AI%20Fundamentals%20with%20IBM%20SkillsBuild.jpg',
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('.cv-dialog')).toBeNull();

    fixture.destroy();
  });

  it('opens the mobile project menu and closes it after selection or Escape', () => {
    const { fixture, element } = createWorkspace();
    const toggle = element.querySelector<HTMLButtonElement>('.tabline');
    if (!toggle) {
      throw new Error('Mobile project menu toggle was not rendered.');
    }

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.editor')?.classList.contains('is-project-menu-open')).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="VoxFilter"]')?.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(selectedProject(element)).toBe('VoxFilter');
    fixture.destroy();
  });

  it('tracks simultaneous physical keys, releases them, and clears held state on window blur', () => {
    const { fixture, element } = createWorkspace();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' }));
    fixture.detectChanges();

    expect(element.querySelector('.keycap[data-code="KeyA"]')?.classList.contains('is-active')).toBe(true);
    expect(element.querySelector('.keycap[data-code="ShiftLeft"]')?.classList.contains('is-active')).toBe(true);
    expect(normalizedText(element.querySelector('.input-foot'))).toContain('a + shift');

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA' }));
    fixture.detectChanges();
    expect(element.querySelector('.keycap[data-code="KeyA"]')?.classList.contains('is-active')).toBe(false);
    expect(element.querySelector('.keycap[data-code="ShiftLeft"]')?.classList.contains('is-active')).toBe(true);

    window.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(element.querySelector('.keycap[data-code="ShiftLeft"]')?.classList.contains('is-active')).toBe(false);
    fixture.destroy();
  });

  it('maps real pointer coordinates and mouse-button state into the live telemetry display', () => {
    const { fixture, element } = createWorkspace();

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 256, clientY: 192 }));
    fixture.detectChanges();

    expect(normalizedText(element.querySelector('.pointer-coordinates'))).toContain('PX 256 / 192');
    expect(normalizedText(element.querySelector('.pointer-coordinates'))).toContain(
      `UV ${(256 / window.innerWidth).toFixed(3)} / ${(192 / window.innerHeight).toFixed(3)}`,
    );
    expect(element.querySelector<HTMLIFrameElement>('.eye-frame')?.getAttribute('src')).toBe('eye-demo.html');
    expect(element.querySelector<HTMLIFrameElement>('.hands-frame')?.getAttribute('src')).toBe('hands-demo.html');
    expect(parseFloat(element.querySelector<HTMLElement>('.pointer-dot')?.style.left ?? '0')).toBeCloseTo(
      (256 / window.innerWidth) * 100,
      1,
    );

    window.dispatchEvent(new MouseEvent('pointerdown', { button: 0, buttons: 1, clientX: 256, clientY: 192 }));
    fixture.detectChanges();
    expect(element.querySelector('.mouse-device')?.classList.contains('is-left-pressed')).toBe(true);

    window.dispatchEvent(new MouseEvent('pointerup', { button: 0, buttons: 0, clientX: 256, clientY: 192 }));
    fixture.detectChanges();
    expect(element.querySelector('.mouse-device')?.classList.contains('is-left-pressed')).toBe(false);
    fixture.destroy();
  });

  it('selects a clicked project and synchronizes the project pane and workspace path', async () => {
    const { fixture, element } = createWorkspace();
    const project = element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="VoxFilter"]');

    project?.click();
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'source: https://github.com/shokomori/VoxFilter');
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('VoxFilter');
    expect(normalizedText(element.querySelector('.winbar'))).toBe('fish — ~/Projects/voxfilter');
    expect(element.querySelector('.buffer')?.textContent).toContain('~/Projects/voxfilter');
    expect(element.querySelector('.buffer')?.textContent).toContain('background noise');
    expect(element.querySelector('.bar-state .col:nth-child(2) .value')?.textContent).toContain('VoxFilter');
    expect(normalizedText(element.querySelector('.terminal-output'))).toContain('lang: C#');
    expect(normalizedText(element.querySelector('.terminal-output'))).toContain('source: https://github.com/shokomori/VoxFilter');

    fixture.destroy();
  }, 15000);

  it('selects a project after a normal pointer click without treating it as a drag', () => {
    const { fixture, element } = createWorkspace();
    const project = element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="Tekken Pitch Deck"]');
    if (!project) {
      throw new Error('Tekken Pitch Deck project card was not rendered.');
    }

    project.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientY: 100 }));
    project.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientY: 100 }));
    project.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('Tekken Pitch Deck');

    fixture.destroy();
  });

  it('does not swallow a separate project click after a wheel drag', async () => {
    const { fixture, element } = createWorkspace();
    const wheel = element.querySelector<HTMLElement>('.wheel');
    const project = element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="VoxFilter"]');
    if (!wheel || !project) {
      throw new Error('Project wheel or VoxFilter project was not rendered.');
    }
    Object.defineProperty(wheel, 'setPointerCapture', { value: () => {} });

    wheel.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientY: 100 }));
    wheel.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientY: 200 }));
    wheel.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientY: 200 }));
    await new Promise<void>((resolve) => window.setTimeout(resolve, 10));
    project.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('VoxFilter');

    fixture.destroy();
  });

  it('includes Apocrypha as a verified music discovery project', async () => {
    const { fixture, element } = createWorkspace();
    const project = element.querySelector<HTMLButtonElement>('.wheel-item[aria-label="Apocrypha"]');

    project?.click();
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'https://github.com/shokomori/apocrypha');
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('Apocrypha');
    expect(element.querySelector('.buffer')?.textContent).toContain('music discovery website');
    expect(element.querySelector('.buffer')?.textContent).toContain('https://github.com/shokomori/apocrypha');

    fixture.destroy();
  }, 15000);

  it('wraps keyboard navigation in both directions without losing selection synchronization', async () => {
    const { fixture, element } = createWorkspace();
    const wheel = element.querySelector<HTMLElement>('.wheel');
    if (!wheel) {
      throw new Error('Project wheel was not rendered.');
    }

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'Angular Portfolio');
    expect(selectedProject(element)).toBe('Angular Portfolio');
    expect(normalizedText(element.querySelector('.buffer'))).toContain('Angular Portfolio');

    wheel.focus();
    wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(selectedProject(element)).toBe('Lorekeeper');

    fixture.destroy();
  });

  it('activates the selected project pane with Enter and returns to the wheel with Escape', () => {
    const { fixture, element } = createWorkspace();
    const wheel = element.querySelector<HTMLElement>('.wheel');
    const pane = element.querySelector<HTMLElement>('.buffer');
    if (!wheel || !pane) {
      throw new Error('Project wheel or detail pane was not rendered.');
    }

    wheel.focus();
    wheel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(pane);
    expect(element.querySelector('.bar-state .col:nth-child(4) .value')?.textContent).toContain('pane');

    pane.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Lorekeeper');

    fixture.destroy();
  });

  it('coalesces trackpad deltas and ignores extra wheel events during the short transition lock', () => {
    const { fixture, element } = createWorkspace();
    const wheel = element.querySelector<HTMLElement>('.wheel');
    if (!wheel) {
      throw new Error('Project wheel was not rendered.');
    }

    for (let step = 0; step < 3; step += 1) {
      wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 18, bubbles: true, cancelable: true }));
    }
    wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('Tekken Pitch Deck');

    fixture.destroy();
  });

  it('keeps terminal typing and browser Tab behavior separate from project shortcuts', () => {
    const { fixture, element } = createWorkspace();
    const input = element.querySelector<HTMLInputElement>('#workspace-command');
    if (!input) {
      throw new Error('Terminal input was not rendered.');
    }

    input.focus();
    input.value = 'j';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const letterEvent = new KeyboardEvent('keydown', { key: 'j', bubbles: true, cancelable: true });
    input.dispatchEvent(letterEvent);
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(tabEvent);
    fixture.detectChanges();

    expect(selectedProject(element)).toBe('Lorekeeper');
    expect(input.value).toBe('j');
    expect(letterEvent.defaultPrevented).toBe(false);
    expect(tabEvent.defaultPrevented).toBe(false);

    fixture.destroy();
  });

  it('navigates command history with the terminal arrow keys', () => {
    const { fixture, element } = createWorkspace();
    const input = element.querySelector<HTMLInputElement>('#workspace-command');
    if (!input) {
      throw new Error('Terminal input was not rendered.');
    }

    input.focus();
    runCommand(element, 'whoami');
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(input.value).toBe('whoami');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(input.value).toBe('');

    fixture.destroy();
  });

  it('echoes submitted commands as their own terminal lines', async () => {
    const { fixture, element } = createWorkspace();
    runCommand(element, 'whoami');
    await waitForTerminalText(fixture, 'GitHub: shokomori');
    fixture.detectChanges();

    const commandLine = Array.from(element.querySelectorAll('.terminal-line.kind-command')).find(
      (line) => normalizedText(line) === '› whoami',
    );
    expect(commandLine).toBeTruthy();
    expect(commandLine?.nextElementSibling?.classList.contains('kind-output')).toBe(true);

    fixture.destroy();
  });

  it('opens the terminal command input with the colon shortcut from the workspace', () => {
    const { fixture, element } = createWorkspace();
    const input = element.querySelector<HTMLInputElement>('#workspace-command');
    if (!input) {
      throw new Error('Terminal input was not rendered.');
    }

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ':', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe(':');

    input.value += 'e ~/Projects/voxfilter';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(selectedProject(element)).toBe('VoxFilter');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(document.activeElement?.getAttribute('aria-label')).toBe('VoxFilter');
    expect(element.querySelector('.bar-state .col:nth-child(4) .value')?.textContent).toContain('wheel');

    fixture.destroy();
  });

  it('runs the reference-style workspace commands using portfolio data', async () => {
    const { fixture, element } = createWorkspace();

    const commands: Array<[string, string]> = [
      ['help', ':e <project-path>'],
      ['ls', 'lorekeeper/'],
      ['pwd', '~/Projects/lorekeeper'],
      ['whoami', 'GitHub: shokomori'],
      ['fetch shokomori', 'projects 13'],
      ['ls links/', 'github  https://github.com/shokomori'],
      [':Git', 'origin https://github.com/shokomori/Lorekeeper'],
    ];
    for (const [command, expectedOutput] of commands) {
      runCommand(element, command);
      fixture.detectChanges();
      await waitForTerminalText(fixture, expectedOutput, 5000);
      fixture.detectChanges();
      expect(element.querySelector('.terminal-output')?.textContent).toContain(expectedOutput);
    }

    runCommand(element, ':e ~/Projects/voxfilter');
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'source: https://github.com/shokomori/VoxFilter');
    fixture.detectChanges();
    expect(selectedProject(element)).toBe('VoxFilter');
    expect(element.querySelector('.buffer')?.textContent).toContain('~/Projects/voxfilter');
    expect(element.querySelector('.terminal-output')?.textContent).toContain('VoxFilter');
    expect(element.querySelector('.terminal-output')?.textContent).toContain('source: https://github.com/shokomori/VoxFilter');
    expect(element.querySelector('.terminal-output')?.textContent).toContain('› :e ~/Projects/voxfilter');

    runCommand(element, ':theme blue');
    fixture.detectChanges();
    expect(element.getAttribute('data-theme')).toBe('blue');

    runCommand(element, ':theme not-a-theme');
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'Theme not available');
    fixture.detectChanges();
    expect(element.getAttribute('data-theme')).toBe('blue');
    expect(latestTerminalError(element)).toContain('Theme not available');

    runCommand(element, 'cat about');
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'command not found');
    fixture.detectChanges();
    expect(latestTerminalError(element)).toContain('command not found');

    runCommand(element, ':e ~/Projects/not-a-real-project');
    fixture.detectChanges();
    await waitForTerminalText(fixture, 'No project at');
    fixture.detectChanges();
    expect(selectedProject(element)).toBe('VoxFilter');
    expect(latestTerminalError(element)).toContain('No project at');

    fixture.destroy();
  }, 30000);

  it('reveals generated terminal output progressively without delaying the next command', async () => {
    const { fixture, element } = createWorkspace();

    runCommand(element, 'whoami');
    fixture.detectChanges();
    expect(element.querySelector('.terminal-line.is-typing')).not.toBeNull();
    expect(element.querySelector('.terminal-output')?.textContent).not.toContain('GitHub: shokomori');

    const output = element.querySelector('.terminal-output')?.textContent ?? '';
    const existingPathCount = output.split('~/Projects/lorekeeper').length - 1;
    runCommand(element, 'pwd');
    fixture.detectChanges();
    expect(element.querySelector('.terminal-output')?.textContent).toContain('GitHub: shokomori');
    await waitForTerminalTextCount(fixture, '~/Projects/lorekeeper', existingPathCount + 1);

    fixture.destroy();
  }, 15000);
});
