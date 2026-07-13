import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
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

type CertificationSort = 'relevant' | 'recent';

type CertificationLayout = 'grid' | 'bento';

type ProjectCta = {
  label: 'Live Demo' | 'Source Code' | 'Case Study';
  url: string;
};

type ProjectItem = {
  type: string;
  typeClass: 'pt-purple' | 'pt-green' | 'pt-coral';
  title: string;
  description: string;
  tags: { label: string; className: 'chip-purple' | 'chip-green' | 'chip-coral' }[];
  metrics: string[];
  ctas: ProjectCta[];
};

type CertificateItem = {
  provider: string;
  title: string;
  meta: string;
  imageSrc?: string;
  imageAlt?: string;
  placeholderText?: string;
  category: Exclude<CertificationCategory, 'all'>;
  isFeatured: boolean;
  issuedAt: string;
  credentialUrl: string | null;
};

type AchievementProof = {
  label: 'Event Page' | 'Photo' | 'Certificate';
  url: string | null;
};

type AchievementItem = {
  year: string;
  title: string;
  type: string;
  description: string;
  dotClass?: 'dot-purple' | 'dot-green' | 'dot-coral';
  proofs: AchievementProof[];
};

type ExperienceItem = {
  date: string;
  title: string;
  org: string;
  description: string;
  dotClass?: 'dot-green' | 'dot-coral';
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
  protected readonly selectedCertificate = signal<CertificateItem | null>(null);
  protected readonly selectedCertificationCategory = signal<CertificationCategory>('all');
  protected readonly selectedCertificationSort = signal<CertificationSort>('relevant');
  protected readonly selectedCertificationLayout = signal<CertificationLayout>('grid');
  protected readonly certificationsExpanded = signal(false);
  protected readonly certificationCategories: CertificationCategoryOption[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'uiux', label: 'UI/UX' },
    { id: 'ai', label: 'AI/Data' },
    { id: 'game', label: 'Game' },
    { id: 'web', label: 'Web/Dev' },
    { id: 'pm', label: 'PM' },
  ];
  protected readonly certificationSortOptions: { id: CertificationSort; label: string }[] = [
    { id: 'relevant', label: 'Most Relevant' },
    { id: 'recent', label: 'Most Recent' },
  ];
  protected readonly certificationLayoutOptions: { id: CertificationLayout; label: string }[] = [
    { id: 'grid', label: 'Grid' },
    { id: 'bento', label: 'Bento' },
  ];
  protected readonly featuredCertificationCount = 10;
  protected readonly isResumeModalOpen = signal(false);

  protected readonly projects: ProjectItem[] = [
    {
      type: 'WEB APP',
      typeClass: 'pt-purple',
      title: 'Bataan Campus Finder',
      description:
        'A web-based campus discovery platform for exploring and locating educational institutions in Bataan with clean, practical UX.',
      tags: [
        { label: 'Interactive Discovery', className: 'chip-purple' },
        { label: 'Location Aware', className: 'chip-green' },
        { label: 'Accessible UI', className: 'chip-coral' },
      ],
      metrics: [],
      ctas: [
        { label: 'Live Demo', url: 'https://shokomori.github.io/Bataan-Campus-Finder/' },
        { label: 'Source Code', url: 'https://github.com/shokomori/Bataan-Campus-Finder' },
      ],
    },
    {
      type: 'AI/ML',
      typeClass: 'pt-green',
      title: 'Helpify-AI',
      description:
        'An AI-powered support system that classifies user intent and improves responses over time through a full machine learning pipeline.',
      tags: [
        { label: 'Text-CNN', className: 'chip-green' },
        { label: 'Reinforcement Learning', className: 'chip-green' },
        { label: 'Scalable ML Pipeline', className: 'chip-purple' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/Helpify-AI' }],
    },
    {
      type: 'STARTUP',
      typeClass: 'pt-coral',
      title: 'VirtuoHero',
      description:
        'A mobile-first AI platform helping Filipino freelancers and students build skills, consistency, and career readiness. My strongest startup-level project.',
      tags: [
        { label: 'Personalized Learning', className: 'chip-coral' },
        { label: 'Habit Building', className: 'chip-coral' },
        { label: 'Career Tracking', className: 'chip-green' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/Virtuo-Hero' }],
    },
    {
      type: 'CREATIVE',
      typeClass: 'pt-purple',
      title: 'JeepBoxHero',
      description:
        'A Filipino-inspired interactive software concept that blends cultural themes with creative system and experience design.',
      tags: [
        { label: 'Cultural Product Design', className: 'chip-purple' },
        { label: 'Interactive Systems', className: 'chip-coral' },
        { label: 'Creative Engineering', className: 'chip-green' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/JeepBoxHero' }],
    },
    {
      type: 'FULL STACK',
      typeClass: 'pt-green',
      title: 'Task Tracker (Full-Stack App)',
      description:
        'A production-style task manager built with full CRUD, REST API integration, and clean architecture across frontend, backend, and database layers.',
      tags: [
        { label: 'Angular', className: 'chip-green' },
        { label: 'ASP.NET Core Web API', className: 'chip-green' },
        { label: 'SQL Server / ADO.NET', className: 'chip-coral' },
      ],
      metrics: [],
      ctas: [],
    },
    {
      type: 'SHOWCASE',
      typeClass: 'pt-coral',
      title: 'Angular Portfolio Website',
      description:
        'A reactive portfolio experience with dynamic effects, hover interactions, and modern UX storytelling to showcase technical depth.',
      tags: [
        { label: 'Reactive UI', className: 'chip-coral' },
        { label: 'Motion Effects', className: 'chip-purple' },
        { label: 'Modern UX', className: 'chip-green' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/Masato-Martin-Portfolio' }],
    },
    {
      type: 'UI LAB',
      typeClass: 'pt-purple',
      title: 'Analog + Digital Clock UI',
      description:
        'A polished clock interface combining animated analog and digital displays, theme switching, and timezone support.',
      tags: [
        { label: 'HTML/CSS/JS', className: 'chip-purple' },
        { label: 'Animation', className: 'chip-coral' },
        { label: 'Timezone Support', className: 'chip-green' },
      ],
      metrics: [],
      ctas: [],
    },
    {
      type: 'AUDIO TOOL',
      typeClass: 'pt-green',
      title: 'VoxFilter',
      description: 'A repository project focused on voice and filtering workflows.',
      tags: [
        { label: 'Audio Processing', className: 'chip-green' },
        { label: 'Filtering', className: 'chip-purple' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/VoxFilter' }],
    },
    {
      type: 'DEV TOOL',
      typeClass: 'pt-purple',
      title: 'GitSprint',
      description: 'A repository project centered on Git workflow acceleration.',
      tags: [
        { label: 'Git Workflows', className: 'chip-coral' },
        { label: 'Developer Tooling', className: 'chip-purple' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/GitSprint' }],
    },
    {
      type: 'BLOCKCHAIN',
      typeClass: 'pt-coral',
      title: 'ChainPulse',
      description: 'A repository project exploring blockchain and on-chain insights.',
      tags: [
        { label: 'Blockchain', className: 'chip-coral' },
        { label: 'Analytics', className: 'chip-green' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/ChainPulse' }],
    },
    {
      type: 'DESIGN ASSET',
      typeClass: 'pt-purple',
      title: 'TCG-Proxy-Template',
      description: 'A template repository for trading card proxy design workflows.',
      tags: [
        { label: 'Template', className: 'chip-purple' },
        { label: 'Design Workflow', className: 'chip-coral' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/TCG-Proxy-Template' }],
    },
    {
      type: 'WEB GENERATOR',
      typeClass: 'pt-green',
      title: "Tether's Movie Streaming Site Generator",
      description: 'A repository project for generating movie streaming site scaffolds.',
      tags: [
        { label: 'Site Generation', className: 'chip-green' },
        { label: 'Web Automation', className: 'chip-purple' },
      ],
      metrics: [],
      ctas: [
        {
          label: 'Source Code',
          url: 'https://github.com/shokomori/Tether-s-Movie-Streaming-Site-Generator',
        },
      ],
    },
    {
      type: 'FRAUD AI',
      typeClass: 'pt-coral',
      title: 'vivy-fraud-detection',
      description: 'A repository project for fraud detection experimentation and modeling.',
      tags: [
        { label: 'Fraud Detection', className: 'chip-coral' },
        { label: 'ML Pipeline', className: 'chip-green' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/vivy-fraud-detection' }],
    },
    {
      type: 'PITCH DECK',
      typeClass: 'pt-purple',
      title: 'Tekken-Pitch-Deck',
      description: 'A repository project focused on concept narrative and deck presentation.',
      tags: [
        { label: 'Storytelling', className: 'chip-purple' },
        { label: 'Presentation', className: 'chip-coral' },
      ],
      metrics: [],
      ctas: [{ label: 'Source Code', url: 'https://github.com/shokomori/Tekken-Pitch-Deck' }],
    },
  ];

  protected readonly certifications: CertificateItem[] = [
    {
      provider: 'Amazon Web Services (AWS)',
      title: 'AWS Academy Graduate - Cloud Foundations - Training Badge',
      meta: 'Issued Mar 2026',
      imageSrc: 'certificates/AWS Academy Graduate - Cloud Foundations - Training Badge.jpg',
      imageAlt: 'AWS Academy Graduate - Cloud Foundations certificate',
      category: 'cloud',
      isFeatured: true,
      issuedAt: '2026-03-01',
      credentialUrl: null,
    },
    {
      provider: 'Google',
      title: 'Conduct UX Research and Test Early Concepts',
      meta: 'Issued May 2025 | Credential ID 5AEYNNH6371Z',
      imageSrc: 'certificates/Conduct UX Research and Test Early Concepts.jpg',
      imageAlt: 'Conduct UX Research and Test Early Concepts certificate',
      category: 'uiux',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/5AEYNNH6371Z',
    },
    {
      provider: 'Google',
      title: 'Build Wireframes and Low-Fidelity Prototypes',
      meta: 'Issued May 2025 | Credential ID HAAMB2503Z2N',
      imageSrc: 'certificates/Build Wireframes and Low-Fidelity Prototypes.jpg',
      imageAlt: 'Build Wireframes and Low-Fidelity Prototypes certificate',
      category: 'uiux',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/HAAMB2503Z2N',
    },
    {
      provider: 'Google',
      title: 'Start the UX Design Process: Empathize, Define, and Ideate',
      meta: 'Issued May 2025 | Credential ID ITYLABNBOP7W',
      imageSrc: 'certificates/Start the UX Design Process Empathize, Define, and Ideate.jpg',
      imageAlt: 'Start the UX Design Process certificate',
      category: 'uiux',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/ITYLABNBOP7W',
    },
    {
      provider: 'Google',
      title: 'Foundations of User Experience (UX) Design',
      meta: 'Issued May 2025 | Credential ID EFN605CXGSBK',
      imageSrc: 'certificates/Foundations of User Experience (UX) Design.jpg',
      imageAlt: 'Foundations of UX Design certificate',
      category: 'uiux',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/EFN605CXGSBK',
    },
    {
      provider: 'Google',
      title: 'Build Dynamic User Interfaces (UI) for Websites',
      meta: 'Issued May 2025 | Credential ID QP3OISPYOJ51',
      imageSrc: 'certificates/Build Dynamic User Interfaces (UI) for Websites.jpg',
      imageAlt: 'Build Dynamic UIs certificate',
      category: 'uiux',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/QP3OISPYOJ51',
    },
    {
      provider: 'Google',
      title: 'Foundations of Project Management',
      meta: 'Issued May 2025 | Credential ID PYK2VA0O4F5Q',
      imageSrc: 'certificates/Foundations of Project Management.jpg',
      imageAlt: 'Foundations of Project Management certificate',
      category: 'pm',
      isFeatured: false,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/PYK2VA0O4F5Q',
    },
    {
      provider: 'IBM',
      title: 'Developing AI Applications with Python and Flask',
      meta: 'Issued May 2025 | Credential ID VY8DZMCC263Z',
      imageSrc: 'certificates/Developing AI Applications with Python and Flask.jpg',
      imageAlt: 'Developing AI Applications with Python and Flask certificate',
      category: 'ai',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/VY8DZMCC263Z',
    },
    {
      provider: 'IBM',
      title: 'Python for Data Science, AI and Development',
      meta: 'Issued May 2025 | Credential ID V0B9YL9MBFUE',
      imageSrc: 'certificates/Python for Data Science, AI & Development.jpg',
      imageAlt: 'Python for Data Science, AI and Development certificate',
      category: 'ai',
      isFeatured: true,
      issuedAt: '2025-05-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/V0B9YL9MBFUE',
    },
    {
      provider: 'Amazon Web Services (AWS)',
      title: 'AWS Services Overview for IT Professionals',
      meta: 'Issued Apr 2025 | Credential ID JE8MTYANIJJC',
      imageSrc: 'certificates/AWS Services Overview for IT Professionals.jpg',
      imageAlt: 'AWS Services Overview for IT Professionals certificate',
      category: 'cloud',
      isFeatured: true,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/JE8MTYANIJJC',
    },
    {
      provider: 'IBM',
      title: 'Developing Back-End Apps with Node.js and Express',
      meta: 'Issued Apr 2025 | Credential ID MZXY0K1W3FSP',
      imageSrc: 'certificates/Developing Back-End Apps with Node.js and Express.jpg',
      imageAlt: 'Developing Back-End Apps with Node.js and Express certificate',
      category: 'web',
      isFeatured: true,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/MZXY0K1W3FSP',
    },
    {
      provider: 'IBM',
      title: 'Developing Front-End Apps with React',
      meta: 'Issued Apr 2025 | Credential ID 9BRNXFNJYE6I',
      imageSrc: 'certificates/Developing Front-End Apps with React.jpg',
      imageAlt: 'Developing Front-End Apps with React certificate',
      category: 'web',
      isFeatured: true,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/9BRNXFNJYE6I',
    },
    {
      provider: 'IBM',
      title: 'Getting Started with Git and GitHub',
      meta: 'Issued Apr 2025 | Credential ID B1YF8UY5Z50H',
      imageSrc: 'certificates/Getting Started with Git and GitHub.jpg',
      imageAlt: 'Getting Started with Git and GitHub certificate',
      category: 'web',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/B1YF8UY5Z50H',
    },
    {
      provider: 'IBM',
      title: 'Introduction to HTML, CSS, and JavaScript',
      meta: 'Issued Apr 2025 | Credential ID FRUCYPR8SNB7',
      imageSrc: 'certificates/Introduction to HTML, CSS, & JavaScript.jpg',
      imageAlt: 'Introduction to HTML, CSS, and JavaScript certificate',
      category: 'web',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/FRUCYPR8SNB7',
    },
    {
      provider: 'IBM',
      title: 'Introduction to Cloud Computing',
      meta: 'Issued Apr 2025 | Credential ID TWRJZ8H6IJF1',
      imageSrc: 'certificates/Introduction to Cloud Computing.jpg',
      imageAlt: 'Introduction to Cloud Computing certificate',
      category: 'cloud',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/TWRJZ8H6IJF1',
    },
    {
      provider: 'IBM',
      title: 'Introduction to Software Engineering',
      meta: 'Issued Apr 2025 | Credential ID RIQAEAP5OA5Q',
      imageSrc: 'certificates/Introduction to Software Engineering.jpg',
      imageAlt: 'Introduction to Software Engineering certificate',
      category: 'web',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/certificate/RIQAEAP5OA5Q',
    },
    {
      provider: 'Google Cloud Training Online',
      title: 'Innovating with Google Cloud AI',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Innovating with Google Cloud AI.jpg',
      imageAlt: 'Innovating with Google Cloud AI certificate',
      category: 'cloud',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Project Management 101',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Project Management 101.jpg',
      imageAlt: 'Project Management 101 certificate',
      category: 'pm',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Introduction to Flutter Course Online',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Introduction to Flutter Course Online.jpg',
      imageAlt: 'Introduction to Flutter Course Online certificate',
      category: 'game',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Blockchain Certification Training',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Blockchain Certification Training.jpg',
      imageAlt: 'Blockchain Certification Training certificate',
      category: 'ai',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Cisco',
      title: 'Computer Hardware Basics',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Computer Hardware Basics.jpg',
      imageAlt: 'Computer Hardware Basics certificate',
      category: 'web',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'IBM',
      title: 'AI Fundamentals with IBM SkillsBuild',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/AI Fundamentals with IBM SkillsBuild.jpg',
      imageAlt: 'AI Fundamentals with IBM SkillsBuild certificate',
      category: 'ai',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Cisco',
      title: 'Introduction to Data Science',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Introduction to Data Science.jpg',
      imageAlt: 'Introduction to Data Science certificate',
      category: 'ai',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Getting Python Interview Ready',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Getting Python Interview Ready.jpg',
      imageAlt: 'Getting Python Interview Ready certificate',
      category: 'ai',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Introduction to Data Science',
      meta: 'Issued Mar 2025',
      imageSrc: 'certificates/Introduction to Data Science Skill Up.jpg',
      imageAlt: 'Introduction to Data Science Skill Up certificate',
      category: 'ai',
      isFeatured: false,
      issuedAt: '2025-03-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Generative AI for Beginners',
      meta: 'Issued Apr 2025',
      imageSrc: 'certificates/Generative AI for Beginners.jpg',
      imageAlt: 'Generative AI for Beginners certificate',
      category: 'ai',
      isFeatured: false,
      issuedAt: '2025-04-01',
      credentialUrl: null,
    },
    {
      provider: 'freeCodeCamp',
      title: 'Relational Database',
      meta: 'Issued Feb 2025 | Credential ID shokomori-rd',
      imageSrc: 'certificates/Relational Database.jpg',
      imageAlt: 'Relational Database certificate',
      category: 'web',
      isFeatured: false,
      issuedAt: '2025-02-01',
      credentialUrl: 'https://www.freecodecamp.org/certification/shokomori/relational-database',
    },
    {
      provider: 'Cisco',
      title: 'JavaScript Essentials 1',
      meta: 'Issued Oct 2024',
      placeholderText: 'Placeholder image: certificates/javascript-essentials-1.png',
      category: 'web',
      isFeatured: false,
      issuedAt: '2024-10-01',
      credentialUrl: null,
    },
    {
      provider: 'Simplilearn',
      title: 'Introduction to Figma',
      meta: 'Issued 2024',
      imageSrc: 'certificates/Introduction to Figma.png',
      imageAlt: 'Introduction to Figma certificate',
      category: 'uiux',
      isFeatured: false,
      issuedAt: '2024-01-01',
      credentialUrl: null,
    },
    {
      provider: 'freeCodeCamp',
      title: 'Responsive Web Design',
      meta: 'Issued Sep 2024 | Credential ID shokomori-rwd',
      placeholderText: 'Placeholder image: certificates/responsive-web-design-certification.png',
      category: 'web',
      isFeatured: false,
      issuedAt: '2024-09-01',
      credentialUrl: 'https://www.freecodecamp.org/certification/shokomori/responsive-web-design',
    },
    {
      provider: 'CompTIA',
      title: 'CompTIA IT Fundamentals (ITF+) Certification',
      meta: 'Issued Nov 2023',
      placeholderText: 'Placeholder image: certificates/comptia-itf-plus.png',
      category: 'web',
      isFeatured: false,
      issuedAt: '2023-11-01',
      credentialUrl: null,
    },
  ];

  protected readonly achievements: AchievementItem[] = [
    {
      year: '2026',
      title: '3rd Place - Base Build Blockchain Hackathon',
      type: 'Hackathon',
      description: 'Won 3rd place by building a blockchain-based solution during Base Build 2026.',
      proofs: [
        { label: 'Event Page', url: null },
        { label: 'Photo', url: null },
        { label: 'Certificate', url: null },
      ],
    },
    {
      year: '2025',
      title: 'Champion - GDG-UPM Build with AI Hackathon',
      type: 'Hackathon',
      description: 'Won champion placement at the GDG-UPM Build with AI Hackathon.',
      dotClass: 'dot-purple',
      proofs: [
        { label: 'Event Page', url: null },
        { label: 'Photo', url: null },
        { label: 'Certificate', url: null },
      ],
    },
    {
      year: '2025',
      title: 'Finalist - Create and Conquer 2025 Hackathon',
      type: 'Hackathon',
      description: 'Reached finalist stage in the Create and Conquer 2025 Hackathon.',
      dotClass: 'dot-green',
      proofs: [
        { label: 'Event Page', url: null },
        { label: 'Photo', url: null },
        { label: 'Certificate', url: null },
      ],
    },
    {
      year: '2025',
      title: 'AWS Learning Club Co-Lead',
      type: 'Community',
      description: 'Co-led AWS Learning Club initiatives that supported peer learning and cloud skill growth.',
      dotClass: 'dot-coral',
      proofs: [
        { label: 'Event Page', url: null },
        { label: 'Photo', url: null },
        { label: 'Certificate', url: null },
      ],
    },
  ];

  protected readonly experiences: ExperienceItem[] = [
    {
      date: 'Jun 2025 - Present',
      title: 'Co-Lead',
      org: 'AWS Learning Club - HAU',
      description:
        'Launched cloud learning initiatives, workshops, and mentorship tracks, resulting in stronger AWS project readiness across the student community.',
    },
    {
      date: 'Jul 2025',
      title: 'Freelance Programmer',
      org: 'School of Sin',
      description:
        'Delivered Angular features, Unreal interactions, and SQL Server workflows that improved product iteration speed for client requirements.',
      dotClass: 'dot-green',
    },
    {
      date: 'Jun 2024 - Jul 2025',
      title: 'GDSC Leadership Roles',
      org: 'Google Developer Student Clubs - HAU',
      description:
        'Managed internal relations and later community-development operations, helping scale collaborative events and member engagement outcomes.',
      dotClass: 'dot-coral',
    },
    {
      date: 'Jul 2023 - Apr 2025',
      title: 'Student Council Leadership Track',
      org: 'HAU School of Computing Student Council',
      description:
        'Progressed from External Affairs Staff to Vice Governor while executing student programs that increased participation and communication reach.',
      dotClass: 'dot-green',
    },
    {
      date: 'Jun 2024 - Apr 2025',
      title: 'Community Development Staff',
      org: 'League of Outstanding Programmers',
      description:
        'Supported engagement campaigns and member activities, resulting in more consistent community participation.',
    },
    {
      date: 'Jun 2023 - Jun 2024',
      title: 'Teen Information Center Officer',
      org: 'Sangguniang Kabataan Brgy. Lalawigan',
      description:
        'Coordinated youth information and wellness outreach efforts that improved local program visibility and attendance.',
      dotClass: 'dot-coral',
    },
    {
      date: 'Sep 2022 - Jun 2024',
      title: 'President',
      org: 'SCSA SHS - Supreme Student Council',
      description:
        'Led student governance and event strategy that translated into sustained school-wide initiative execution.',
      dotClass: 'dot-green',
    },
    {
      date: 'Sep 2022 - Jul 2023',
      title: 'Head Photojournalist',
      org: 'Catherinian Gazette',
      description:
        'Directed event coverage and visual storytelling outputs that strengthened campus publication quality and consistency.',
    },
    {
      date: 'Jun 2018 - Jul 2022',
      title: 'Member',
      org: 'FREEMAGE',
      description:
        'Contributed to design and layout deliverables that supported the team\'s creative production goals.',
      dotClass: 'dot-coral',
    },
  ];

  protected readonly filteredCertifications = computed(() => {
    const selected = this.selectedCertificationCategory();
    return this.certifications.filter(
      (certificate) => selected === 'all' || certificate.category === selected,
    );
  });

  protected readonly sortedCertifications = computed(() => {
    const sort = this.selectedCertificationSort();
    const certifications = [...this.filteredCertifications()];

    certifications.sort((a, b) => {
      if (sort === 'recent') {
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      }

      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    });

    return certifications;
  });

  protected readonly visibleCertifications = computed(() => {
    const certifications = this.sortedCertifications();
    if (this.certificationsExpanded()) {
      return certifications;
    }
    return certifications.slice(0, this.featuredCertificationCount);
  });

  protected readonly hasHiddenCertifications = computed(
    () => this.sortedCertifications().length > this.featuredCertificationCount,
  );

  protected readonly contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  private observer?: IntersectionObserver;
  private sectionElements: HTMLElement[] = [];
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
    this.syncActiveSectionWithViewport();

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

  protected openCertificatePreview(certificate: CertificateItem): void {
    if (!certificate.imageSrc) {
      return;
    }

    this.selectedCertificate.set(certificate);
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
    this.certificationsExpanded.set(false);
  }

  protected onCertificationSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value as CertificationSort | undefined;
    const allowed = new Set<CertificationSort>(['relevant', 'recent']);

    if (!value || !allowed.has(value)) {
      return;
    }

    this.selectedCertificationSort.set(value);
    this.certificationsExpanded.set(false);
  }

  protected setCertificationLayout(layout: CertificationLayout): void {
    this.selectedCertificationLayout.set(layout);
  }

  protected toggleCertificationsExpanded(): void {
    this.certificationsExpanded.update((expanded) => !expanded);
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
    this.sectionElements = sections;

    this.observer = new IntersectionObserver(
      () => this.syncActiveSectionWithViewport(),
      {
        threshold: [0, 0.15, 0.3],
        rootMargin: '-86px 0px -55% 0px',
      },
    );

    for (const section of sections) {
      this.observer.observe(section);
    }

    this.syncActiveSectionWithViewport();
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

  private syncActiveSectionWithViewport(): void {
    if (!this.sectionElements.length) {
      return;
    }

    const anchorY = 110;
    let active: HTMLElement | null = null;

    for (const section of this.sectionElements) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchorY && rect.bottom > anchorY) {
        active = section;
      }
    }

    if (!active) {
      active =
        this.sectionElements.find((section) => section.getBoundingClientRect().top > anchorY) ??
        this.sectionElements[this.sectionElements.length - 1];
    }

    if (active && this.activeSection() !== active.id) {
      this.activeSection.set(active.id);
    }
  }

}
