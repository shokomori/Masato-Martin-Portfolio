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

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
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
    'projects',
    'certifications',
    'achievements',
    'experience',
    'contact',
  ];
  protected readonly activeSection = signal('about');
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly mouseX = signal(window.innerWidth / 2);
  protected readonly mouseY = signal(window.innerHeight / 2);
  protected readonly cursorInteractive = signal(false);
  protected readonly cursorPressed = signal(false);
  protected readonly cursorScrolling = signal(false);

  protected readonly contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  private observer?: IntersectionObserver;
  private readonly canvasNodes: NodePoint[] = [];
  private animationFrameId = 0;
  private scrollStopTimer = 0;
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
    } catch {
      this.submitState.set('error');
    }
  }

  protected isActive(sectionId: string): boolean {
    return this.activeSection() === sectionId;
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
    const count = Math.min(80, Math.max(36, Math.floor(canvas.width / 24)));

    for (let i = 0; i < count; i += 1) {
      this.canvasNodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      });
    }
  }

  private drawFrame(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const pointerX = this.mouseX();
    const pointerY = this.mouseY();

    for (const node of this.canvasNodes) {
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
      if (distance < 120 && distance > 0) {
        const force = (120 - distance) / 1200;
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;
      }

      node.vx += (Math.random() - 0.5) * 0.01;
      node.vy += (Math.random() - 0.5) * 0.01;
      node.vx *= 0.995;
      node.vy *= 0.995;

      const speed = Math.hypot(node.vx, node.vy);
      if (speed < 0.05) {
        const angle = Math.random() * Math.PI * 2;
        node.vx = Math.cos(angle) * 0.08;
        node.vy = Math.sin(angle) * 0.08;
      }
      if (speed > 0.65) {
        node.vx *= 0.9;
        node.vy *= 0.9;
      }

      node.x = Math.max(0, Math.min(canvas.width, node.x));
      node.y = Math.max(0, Math.min(canvas.height, node.y));
    }

    context.lineWidth = 0.6;
    for (let i = 0; i < this.canvasNodes.length; i += 1) {
      for (let j = i + 1; j < this.canvasNodes.length; j += 1) {
        const a = this.canvasNodes[i];
        const b = this.canvasNodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 150) {
          const alpha = 1 - distance / 150;
          context.strokeStyle = `rgba(129, 189, 255, ${alpha * 0.2})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }

    for (const node of this.canvasNodes) {
      context.fillStyle = 'rgba(130, 228, 255, 0.75)';
      context.beginPath();
      context.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
      context.fill();
    }
  }
}
