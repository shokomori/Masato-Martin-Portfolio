import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

type ParticleMode = 'constellation' | 'nebula' | 'comet';

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
};

type ParticleModeOption = {
  id: ParticleMode;
  label: string;
  hint: string;
};

type CertificationCategory = 'all' | 'cloud' | 'uiux' | 'ai' | 'game' | 'web' | 'pm';

type CertificationCategoryOption = {
  id: CertificationCategory;
  label: string;
};

type ToastState = {
  kind: 'success' | 'error';
  message: string;
};

type CertificatePreview = {
  title: string;
  provider: string;
  src: string;
  alt: string;
};

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') private readonly bgCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly fb = inject(FormBuilder);

  protected readonly navSections = [
    'about',
    'skills',
    'techstack',
    'projects',
    'certifications',
    'achievements',
    'experience',
    'contact',
  ];
  protected readonly activeSection = signal('about');
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly activeParticleMode = signal<ParticleMode>('comet');
  protected readonly particleModes: ParticleModeOption[] = [
    { id: 'constellation', label: '1', hint: 'Connected node network' },
    { id: 'nebula', label: '2', hint: 'Soft drifting stardust' },
    { id: 'comet', label: '3', hint: 'Fast streak motion' },
  ];
  protected readonly scrollProgress = signal(0);
  protected readonly mouseX = signal(window.innerWidth / 2);
  protected readonly mouseY = signal(window.innerHeight / 2);
  protected readonly cursorInteractive = signal(false);
  protected readonly cursorPressed = signal(false);
  protected readonly cursorScrolling = signal(false);
  protected readonly cursorNodeHot = signal(false);
  protected readonly feedbackToast = signal<ToastState | null>(null);
  protected readonly selectedCertificate = signal<CertificatePreview | null>(null);
  protected readonly selectedCertificationCategory = signal<CertificationCategory>('all');
  protected readonly certificationCategories: CertificationCategoryOption[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'uiux', label: 'UI/UX' },
    { id: 'ai', label: 'AI/Data' },
    { id: 'game', label: 'Game' },
    { id: 'web', label: 'Web/Dev' },
    { id: 'pm', label: 'PM' },
  ];
  protected readonly isResumeModalOpen = signal(false);

  protected readonly contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  private observer?: IntersectionObserver;
  private readonly canvasNodes: NodePoint[] = [];
  private animationFrameId = 0;
  private scrollStopTimer = 0;
  private feedbackToastTimer = 0;
  private scrollMomentum = 0;
  private backgroundContext?: CanvasRenderingContext2D;
  private backgroundCanvas?: HTMLCanvasElement;

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  };

  private readonly handleResize = (): void => {
    this.resizeCanvas();
    const canvas = this.bgCanvas?.nativeElement;
    if (canvas) {
      this.buildNodes(canvas);
    }
  };

  private readonly handlePointerOver = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      this.cursorInteractive.set(false);
      return;
    }

    this.cursorInteractive.set(Boolean(target.closest('a, button, input, textarea, .proj-card')));
  };

  private readonly handlePointerDown = (): void => {
    this.cursorPressed.set(true);
  };

  private readonly handlePointerUp = (): void => {
    this.cursorPressed.set(false);
  };

  private readonly handleScroll = (): void => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.max(0, Math.min(100, (scrollTop / maxScroll) * 100));
    const delta = scrollTop - (this.scrollProgress() / 100) * maxScroll;

    this.scrollProgress.set(progress);
    this.scrollMomentum = Math.max(-2.2, Math.min(2.2, this.scrollMomentum * 0.55 + delta * 0.01));
    document.documentElement.style.setProperty('--scroll-progress', `${progress}`);
    document.documentElement.style.setProperty('--scroll-momentum', `${this.scrollMomentum}`);

    this.cursorScrolling.set(true);
    if (this.scrollStopTimer) {
      window.clearTimeout(this.scrollStopTimer);
    }
    this.scrollStopTimer = window.setTimeout(() => {
      this.cursorScrolling.set(false);
    }, 140);
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.startBackgroundAnimation();
    }
  };

  protected openCertificatePreview(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const card = target?.closest('.cert-card');
    const image = card?.querySelector('img');
    const title = card?.querySelector('.cert-title')?.textContent?.trim();
    const provider = card?.querySelector('.cert-provider')?.textContent?.trim();

    if (!card || !image || !title || !provider) {
      return;
    }

    this.selectedCertificate.set({
      title,
      provider,
      src: image.getAttribute('src') ?? image.src,
      alt: image.getAttribute('alt') ?? title,
    });
  }

  protected closeCertificatePreview(): void {
    this.selectedCertificate.set(null);
  }

  protected onCertificationCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value as CertificationCategory | undefined;
    const allowed = new Set<CertificationCategory>(['all', 'cloud', 'uiux', 'ai', 'game', 'web', 'pm']);

    if (!value || !allowed.has(value)) {
      return;
    }

    this.selectedCertificationCategory.set(value);
    this.applyCertificationFilter();
  }

  protected openResumeModal(): void {
    this.isResumeModalOpen.set(true);
  }

  protected closeResumeModal(): void {
    this.isResumeModalOpen.set(false);
  }

  ngAfterViewInit(): void {
    this.initializeBackground();

    window.addEventListener('mouseover', this.handlePointerOver);
    window.addEventListener('mousedown', this.handlePointerDown);
    window.addEventListener('mouseup', this.handlePointerUp);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const sections = this.navSections
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id);
          }
        }
      },
      {
        threshold: 0.45,
        rootMargin: '-80px 0px -30% 0px',
      },
    );

    for (const section of sections) {
      this.observer.observe(section);
    }

    this.applyCertificationFilter();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mouseover', this.handlePointerOver);
    window.removeEventListener('mousedown', this.handlePointerDown);
    window.removeEventListener('mouseup', this.handlePointerUp);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.scrollStopTimer) {
      window.clearTimeout(this.scrollStopTimer);
    }
    if (this.feedbackToastTimer) {
      window.clearTimeout(this.feedbackToastTimer);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  protected async submitContact(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitState.set('submitting');

    try {
      const payload = {
        name: this.contactForm.value.name ?? '',
        email: this.contactForm.value.email ?? '',
        message: this.contactForm.value.message ?? '',
      };

      const response = await fetch('https://formsubmit.co/ajax/masatomartin9@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          _subject: 'Portfolio contact form message',
          _captcha: 'false',
          _template: 'table',
        }),
      });

      if (!response.ok) {
        throw new Error('Contact request failed');
      }

      this.contactForm.reset();
      this.submitState.set('success');
      this.showToast('success', 'Your message was sent. I will get back to you soon.');
    } catch {
      this.submitState.set('error');
      this.showToast('error', 'Message could not be sent. Please email me directly.');
    }
  }

  protected isActive(sectionId: string): boolean {
    return this.activeSection() === sectionId;
  }

  protected setActiveSection(sectionId: string): void {
    this.activeSection.set(sectionId);
  }

  protected setParticleMode(mode: ParticleMode): void {
    if (this.activeParticleMode() === mode) {
      return;
    }

    this.activeParticleMode.set(mode);
    const canvas = this.backgroundCanvas ?? this.bgCanvas?.nativeElement;
    if (canvas) {
      this.buildNodes(canvas);
    }
  }

  private initializeBackground(): void {
    const canvas = this.bgCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.backgroundContext = context;
    this.backgroundCanvas = canvas;

    this.resizeCanvas();
    this.buildNodes(canvas);
    this.handleScroll();

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);

    this.startBackgroundAnimation();
  }

  private startBackgroundAnimation(): void {
    if (!this.backgroundContext || !this.backgroundCanvas || this.animationFrameId) {
      return;
    }

    const animate = (): void => {
      if (!this.backgroundContext || !this.backgroundCanvas) {
        this.animationFrameId = 0;
        return;
      }
      this.drawFrame(this.backgroundContext, this.backgroundCanvas);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private resizeCanvas(): void {
    const canvas = this.bgCanvas?.nativeElement;
    if (!canvas) {
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private buildNodes(canvas: HTMLCanvasElement): void {
    this.canvasNodes.length = 0;
    const mode = this.activeParticleMode();
    const count =
      mode === 'nebula'
        ? Math.min(64, Math.max(28, Math.floor(canvas.width / 30)))
        : mode === 'comet'
          ? Math.min(120, Math.max(54, Math.floor(canvas.width / 20)))
          : Math.min(80, Math.max(36, Math.floor(canvas.width / 24)));
    const velocityFactor = mode === 'comet' ? 0.55 : mode === 'nebula' ? 0.22 : 0.35;
    const baseSize = mode === 'nebula' ? 2.2 : mode === 'comet' ? 1.5 : 1.8;

    for (let i = 0; i < count; i += 1) {
      this.canvasNodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * velocityFactor,
        vy: (Math.random() - 0.5) * velocityFactor,
        size: baseSize + Math.random() * (mode === 'nebula' ? 2 : 0.9),
        alpha: 0.45 + Math.random() * 0.55,
      });
    }
  }

  private drawFrame(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const mode = this.activeParticleMode();

    if (mode === 'comet') {
      context.fillStyle = 'rgba(10, 10, 15, 0.16)';
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    const pointerX = this.mouseX();
    const pointerY = this.mouseY();
    const scrollMomentum = this.scrollMomentum;
    const scrollLerp = this.scrollProgress() / 100;
    let nodeHot = false;

    context.save();
    context.translate(0, Math.sin(scrollLerp * Math.PI) * 4);

    if (mode === 'nebula') {
      const nebulaGradient = context.createRadialGradient(pointerX, pointerY, 20, pointerX, pointerY, 180);
      nebulaGradient.addColorStop(0, 'rgba(127, 106, 240, 0.08)');
      nebulaGradient.addColorStop(1, 'rgba(127, 106, 240, 0)');
      context.fillStyle = nebulaGradient;
      context.beginPath();
      context.arc(pointerX, pointerY, 180, 0, Math.PI * 2);
      context.fill();
    }

    for (const node of this.canvasNodes) {
      const scrollShift = mode === 'comet' ? 0.2 : mode === 'nebula' ? 0.08 : 0.12;
      node.x += Math.sin((node.y + scrollLerp * 180) / 150) * scrollMomentum * (mode === 'nebula' ? 0.02 : 0.04);
      node.y += scrollMomentum * scrollShift;
      node.x += node.vx;
      node.y += node.vy;

      if (node.x <= 0 || node.x >= canvas.width) {
        node.vx *= -1;
        node.x = Math.max(0, Math.min(canvas.width, node.x));
      }
      if (node.y <= 0 || node.y >= canvas.height) {
        node.vy *= -1;
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      }

      const dx = node.x - pointerX;
      const dy = node.y - pointerY;
      const distance = Math.hypot(dx, dy);
      if (distance < (mode === 'nebula' ? 48 : 34)) {
        nodeHot = true;
      }
      const interactionRadius = mode === 'nebula' ? 180 : mode === 'comet' ? 100 : 120;
      if (distance < interactionRadius && distance > 0) {
        const force = (interactionRadius - distance) / (mode === 'comet' ? 1400 : 1200);
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;
      }

      node.vx += (Math.random() - 0.5) * (mode === 'nebula' ? 0.007 : 0.01);
      node.vy += (Math.random() - 0.5) * (mode === 'nebula' ? 0.007 : 0.01);
      node.vx *= mode === 'comet' ? 0.992 : 0.995;
      node.vy *= mode === 'comet' ? 0.992 : 0.995;

      const speed = Math.hypot(node.vx, node.vy);
      if (speed < (mode === 'nebula' ? 0.03 : 0.05)) {
        const angle = Math.random() * Math.PI * 2;
        const minSpeed = mode === 'comet' ? 0.12 : 0.08;
        node.vx = Math.cos(angle) * minSpeed;
        node.vy = Math.sin(angle) * minSpeed;
      }
      if (speed > (mode === 'comet' ? 0.95 : 0.65)) {
        node.vx *= 0.9;
        node.vy *= 0.9;
      }

      node.x = Math.max(0, Math.min(canvas.width, node.x));
      node.y = Math.max(0, Math.min(canvas.height, node.y));
    }

    if (mode !== 'nebula') {
      const maxDistance = mode === 'comet' ? 95 : 150;
      context.lineWidth = mode === 'comet' ? 0.45 : 0.6;
      for (let i = 0; i < this.canvasNodes.length; i += 1) {
        for (let j = i + 1; j < this.canvasNodes.length; j += 1) {
          const a = this.canvasNodes[i];
          const b = this.canvasNodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < maxDistance) {
            const alpha = 1 - distance / maxDistance;
            const boost = 1 + Math.min(1, Math.abs(scrollMomentum) / 2.2) * 0.9;
            context.strokeStyle =
              mode === 'comet'
                ? `rgba(240, 112, 96, ${alpha * 0.22 * boost})`
                : `rgba(129, 189, 255, ${alpha * 0.2 * boost})`;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }
    }

    for (const node of this.canvasNodes) {
      const motionBoost = Math.min(0.45, Math.abs(scrollMomentum) * 0.08);

      if (mode === 'nebula') {
        context.fillStyle = `rgba(129, 189, 255, ${(0.18 + motionBoost) * node.alpha})`;
        context.beginPath();
        context.arc(node.x, node.y, node.size * 2.1, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = `rgba(61, 214, 163, ${(0.08 + motionBoost * 0.6) * node.alpha})`;
        context.beginPath();
        context.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        context.fill();
        continue;
      }

      if (mode === 'comet') {
        const tailLength = Math.min(16, Math.hypot(node.vx, node.vy) * 26 + 4);
        context.strokeStyle = `rgba(240, 112, 96, ${(0.26 + motionBoost) * node.alpha})`;
        context.lineWidth = Math.max(0.8, node.size * 0.55);
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(node.x - node.vx * tailLength, node.y - node.vy * tailLength);
        context.stroke();
      }

      const nodeGlow = 0.55 + motionBoost;
      const baseColor = mode === 'comet' ? '240, 112, 96' : '130, 228, 255';
      context.fillStyle = `rgba(${baseColor}, ${nodeGlow * node.alpha})`;
      context.beginPath();
      context.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      context.fill();
    }

    if (this.cursorNodeHot() !== nodeHot) {
      this.cursorNodeHot.set(nodeHot);
    }

    context.restore();
  }

  private showToast(kind: ToastState['kind'], message: string): void {
    this.feedbackToast.set({ kind, message });
    if (this.feedbackToastTimer) {
      window.clearTimeout(this.feedbackToastTimer);
    }
    this.feedbackToastTimer = window.setTimeout(() => {
      this.feedbackToast.set(null);
    }, 3800);
  }

  private inferCertificationCategory(card: HTMLElement): CertificationCategory {
    const provider = card.querySelector('.cert-provider')?.textContent?.toLowerCase() ?? '';
    const title = card.querySelector('.cert-title')?.textContent?.toLowerCase() ?? '';
    const combined = `${provider} ${title}`;

    if (combined.includes('ux') || combined.includes('wireframe') || combined.includes('figma') || combined.includes('ui')) {
      return 'uiux';
    }

    if (combined.includes('cloud') || combined.includes('aws') || combined.includes('google cloud')) {
      return 'cloud';
    }

    if (
      combined.includes('ai') ||
      combined.includes('data science') ||
      combined.includes('generative') ||
      combined.includes('blockchain')
    ) {
      return 'ai';
    }

    if (combined.includes('project management')) {
      return 'pm';
    }

    if (combined.includes('unreal') || combined.includes('game')) {
      return 'game';
    }

    return 'web';
  }

  private applyCertificationFilter(): void {
    const selected = this.selectedCertificationCategory();
    const cards = document.querySelectorAll<HTMLElement>('.cert-grid .cert-card');

    for (const card of cards) {
      const category = this.inferCertificationCategory(card);
      const shouldShow = selected === 'all' || category === selected;
      card.classList.toggle('is-filtered-out', !shouldShow);
      card.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }
  }
}
