import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Turso database client (works with remote and local files)
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '../gitscout.db')}`;
const dbToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// Middleware to ensure database is initialized before handling any request
const dbReady = initDatabase().catch(err => {
  console.error('Database initialization crashed on startup:', err);
});

app.use(async (_req, _res, next) => {
  await dbReady;
  next();
});

// Async database schema and seed initializer
async function initDatabase() {
  try {
    console.log('Verifying table schema on database...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY,
        owner TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        language TEXT,
        stars INTEGER,
        starDelta INTEGER,
        forks INTEGER,
        topics TEXT,
        category TEXT,
        oppType TEXT,
        avatar TEXT,
        healthScore INTEGER,
        activity TEXT,
        signals TEXT,
        busFactor INTEGER,
        forkOpportunity TEXT,
        forkTags TEXT,
        opportunityPitch TEXT,
        opportunityGap TEXT,
        opportunityTargetAreas TEXT,
        opportunityROI TEXT,
        issues TEXT,
        contributionGuide TEXT,
        trendData TEXT,
        created_at TEXT
      );
    `);
    await seedDatabase();
  } catch (error: any) {
    console.error('Error during database initialization:', error.message);
  }
}

// Mock datasets for seeding (complete from prototype for perfect design fidelity)
const initialTrending = [
  {
    id: 1,
    owner: 'tensorlayer',
    name: 'voxelforge',
    description: 'High-performance 3D voxel engine with GPU-accelerated ray marching. Built for procedural generation and real-time editing.',
    language: 'rust',
    stars: 12847,
    starDelta: 1423,
    forks: 892,
    topics: ['rust', '3d', 'voxel', 'gaming', 'gpu'],
    category: 'ai',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=voxelforge'
  },
  {
    id: 2,
    owner: 'neuralflow',
    name: 'promptdeck',
    description: 'Unified API for testing and comparing LLM prompts across providers. Ships with built-in eval harness and cost tracking.',
    language: 'python',
    stars: 8432,
    starDelta: 892,
    forks: 534,
    topics: ['llm', 'prompt-engineering', 'api', 'evaluation'],
    category: 'ai',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=promptdeck'
  },
  {
    id: 3,
    owner: 'quickbyte',
    name: 'dbmate-go',
    description: 'Lightweight database migration tool for Go. Supports PostgreSQL, MySQL, SQLite, and ClickHouse with zero dependencies.',
    language: 'go',
    stars: 6721,
    starDelta: 634,
    forks: 412,
    topics: ['database', 'migrations', 'golang', 'cli'],
    category: 'data',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmate-go'
  },
  {
    id: 4,
    owner: 'solarpunk-dev',
    name: 'terraform-cloud',
    description: 'Open-source alternative to Terraform Cloud. Self-hosted infrastructure provisioning with collaborative state management.',
    language: 'typescript',
    stars: 15203,
    starDelta: 2104,
    forks: 1247,
    topics: ['infrastructure', 'terraform', 'devops', 'self-hosted'],
    category: 'infra',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=terraform-cloud'
  },
  {
    id: 5,
    owner: 'rustshell',
    name: 'ionshell',
    description: 'Blazing fast shell written in Rust. POSIX-compatible with modern features like async pipelines and smart tab completion.',
    language: 'rust',
    stars: 9876,
    starDelta: 1056,
    forks: 678,
    topics: ['shell', 'rust', 'cli', 'posix', 'terminal'],
    category: 'devtools',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ionshell'
  },
  {
    id: 6,
    owner: 'webcore-labs',
    name: 'reactive-table',
    description: 'Zero-config data table component for React. Virtual scrolling, column sorting, filtering, and CSV export out of the box.',
    language: 'typescript',
    stars: 7654,
    starDelta: 743,
    forks: 521,
    topics: ['react', 'table', 'component', 'typescript', 'ui'],
    category: 'web',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=reactive-table'
  },
  {
    id: 7,
    owner: 'mobilecraft',
    name: 'swiftkit-lite',
    description: 'Minimal iOS development toolkit. Camera, storage, networking, and analytics in a single lightweight package.',
    language: 'swift',
    stars: 4321,
    starDelta: 312,
    forks: 287,
    topics: ['ios', 'swift', 'mobile', 'toolkit'],
    category: 'mobile',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=swiftkit-lite'
  },
  {
    id: 8,
    owner: 'dataweave',
    name: 'arrowdb',
    description: 'Columnar database optimized for analytical queries. Apache Arrow integration for zero-copy data sharing between systems.',
    language: 'cpp',
    stars: 11234,
    starDelta: 1567,
    forks: 834,
    topics: ['database', 'analytics', 'arrow', 'columnar', 'cpp'],
    category: 'data',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=arrowdb'
  },
  {
    id: 9,
    owner: 'devflow-io',
    name: 'pr-review-bot',
    description: 'Automated code review assistant. Integrates with GitHub Actions to provide linting, security scans, and AI-powered suggestions.',
    language: 'python',
    stars: 5432,
    starDelta: 456,
    forks: 312,
    topics: ['github-actions', 'code-review', 'automation', 'python'],
    category: 'devtools',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=pr-review-bot'
  },
  {
    id: 10,
    owner: 'kubeforge',
    name: 'k8s-operator-sdk',
    description: 'Framework for building Kubernetes operators in Go. Simplifies custom resource definitions and reconciliation loops.',
    language: 'go',
    stars: 8901,
    starDelta: 923,
    forks: 645,
    topics: ['kubernetes', 'operator', 'golang', 'devops'],
    category: 'infra',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=k8s-operator-sdk'
  },
  {
    id: 11,
    owner: 'neuralpaint',
    name: 'diffusion-studio',
    description: 'Real-time image generation UI with model switching. Supports Stable Diffusion, Flux, and custom ONNX models locally.',
    language: 'python',
    stars: 18923,
    starDelta: 2847,
    forks: 1523,
    topics: ['stable-diffusion', 'image-generation', 'gui', 'ai'],
    category: 'ai',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=diffusion-studio'
  },
  {
    id: 12,
    owner: 'flutterkit',
    name: 'flutter-widgets',
    description: 'Collection of 50+ production-ready Flutter widgets. Custom painters, animations, and adaptive layouts included.',
    language: 'dart',
    stars: 6234,
    starDelta: 534,
    forks: 423,
    topics: ['flutter', 'dart', 'widgets', 'mobile', 'ui'],
    category: 'mobile',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=flutter-widgets'
  },
  {
    id: 13,
    owner: 'streamforge',
    name: 'kafka-lite',
    description: 'Embedded message broker compatible with Kafka protocol. Perfect for development and testing without external dependencies.',
    language: 'java',
    stars: 7891,
    starDelta: 687,
    forks: 534,
    topics: ['kafka', 'messaging', 'broker', 'java', 'embedded'],
    category: 'data',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=kafka-lite'
  },
  {
    id: 14,
    owner: 'webcraft',
    name: 'astro-icons',
    description: 'Icon library optimized for Astro framework. Tree-shakeable, accessible, with 2000+ icons in multiple formats.',
    language: 'typescript',
    stars: 3456,
    starDelta: 234,
    forks: 189,
    topics: ['astro', 'icons', 'typescript', 'web-components'],
    category: 'web',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=astro-icons'
  }
];

const initialOpportunities = [
  {
    id: 101,
    owner: 'openml-toolkit',
    name: 'feature-store',
    description: 'Feature store for ML pipelines. Manages feature computation, storage, and serving with point-in-time correctness.',
    language: 'python',
    stars: 3421,
    starDelta: 234,
    forks: 198,
    topics: ['ml', 'feature-store', 'python', 'data-pipeline'],
    category: 'ai',
    oppType: 'rising',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=feature-store',
    healthScore: 72,
    activity: [3,5,2,7,4,6,8,3,5,9,4,6,2,8,5,7,3,4,6,9,2,5,7,4,8,3,6,5,7,4],
    signals: [
      { type: 'positive', icon: 'ph-trend-up', text: 'Star growth 40% month-over-month' },
      { type: 'positive', icon: 'ph-git-branch', text: 'Active PRs merged in last 7 days' },
      { type: 'warning', icon: 'ph-users', text: 'Only 2 active maintainers' },
      { type: 'neutral', icon: 'ph-calendar', text: 'Created 8 months ago' }
    ],
    busFactor: 2,
    forkOpportunity: 'Strong candidate for contribution. Open issues tagged good-first-issue. Documentation needs improvement.',
    forkTags: ['documentation', 'good-first-issue', 'python', 'ml'],
    opportunityPitch: 'Feature store is the missing piece in most ML pipelines. This project is growing fast (40% MoM) but only has 2 maintainers. Contributing now means you get to shape the architecture of what could become the standard feature store for Python ML.',
    issues: [
      { num: 142, title: 'Add Redis backend for feature serving', difficulty: 'medium', time: '1-2 days', labels: ['enhancement', 'good-first-issue'], url: '#' },
      { num: 156, title: 'Implement point-in-time joins for streaming features', difficulty: 'hard', time: '3-5 days', labels: ['core', 'enhancement'], url: '#' },
      { num: 163, title: 'Fix timezone handling in feature computation', difficulty: 'easy', time: '2-4 hours', labels: ['bug', 'good-first-issue'], url: '#' },
      { num: 171, title: 'Add Parquet format support for offline store', difficulty: 'medium', time: '1-2 days', labels: ['enhancement'], url: '#' },
      { num: 180, title: 'Write migration guide from Feast', difficulty: 'easy', time: '4-6 hours', labels: ['documentation'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork and clone', detail: 'git clone your-fork && cd feature-store', icon: 'ph-git-fork' },
      { step: 2, title: 'Install dependencies', detail: 'pip install -e ".[dev]" && pre-commit install', icon: 'ph-package' },
      { step: 3, title: 'Run tests', detail: 'pytest tests/ -x --tb=short', icon: 'ph-test-tube' },
      { step: 4, title: 'Pick an issue', detail: 'Start with label good-first-issue', icon: 'ph-flag' }
    ]
  },
  {
    id: 102,
    owner: 'bounty-hunter',
    name: 'api-gateway-rs',
    description: 'Lightweight API gateway in Rust. Rate limiting, auth middleware, and request routing with sub-millisecond latency.',
    language: 'rust',
    stars: 5678,
    starDelta: 456,
    forks: 312,
    topics: ['api-gateway', 'rust', 'middleware', 'rate-limiting'],
    category: 'infra',
    oppType: 'bounty',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=api-gateway-rs',
    healthScore: 81,
    activity: [5,7,3,8,6,4,9,5,7,3,6,8,4,7,5,9,3,6,8,4,7,5,3,8,6,4,9,5,7,3],
    signals: [
      { type: 'positive', icon: 'ph-currency-circle-dollar', text: '3 issues with bounties ($50-$200)' },
      { type: 'positive', icon: 'ph-star', text: 'High star count indicates strong demand' },
      { type: 'warning', icon: 'ph-warning', text: 'Open security audit issues pending' },
      { type: 'negative', icon: 'ph-clock', text: 'Last release 45 days ago' }
    ],
    busFactor: 3,
    forkOpportunity: 'Active bounty program. Well-documented contribution guide. Good codebase for learning Rust async patterns.',
    forkTags: ['bounty', 'rust', 'async', 'good-first-issue'],
    opportunityPitch: 'Real money on the table. Three open bounties ranging $50-$200, plus the codebase is a masterclass in Rust async. Contributing here levels up your Rust skills AND pays you.',
    issues: [
      { num: 89, title: 'Implement JWT token validation middleware', difficulty: 'medium', time: '$100 bounty', labels: ['bounty', 'security'], url: '#' },
      { num: 94, title: 'Add rate limiting with sliding window algorithm', difficulty: 'medium', time: '$150 bounty', labels: ['bounty', 'performance'], url: '#' },
      { num: 101, title: 'Fix connection pool leak under high concurrency', difficulty: 'hard', time: '$200 bounty', labels: ['bounty', 'bug', 'critical'], url: '#' },
      { num: 108, title: 'Add OpenTelemetry tracing support', difficulty: 'medium', time: '2-3 days', labels: ['observability', 'enhancement'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork and clone', detail: 'git clone your-fork && cd api-gateway-rs', icon: 'ph-git-fork' },
      { step: 2, title: 'Build project', detail: 'cargo build && cargo test', icon: 'ph-hammer' },
      { step: 3, title: 'Read CONTRIBUTING.md', detail: 'Detailed bounty claim process inside', icon: 'ph-book-open' },
      { step: 4, title: 'Claim a bounty', detail: 'Comment on the issue to claim before starting before starting work', icon: 'ph-currency-circle-dollar' }
    ]
  },
  {
    id: 103,
    owner: 'legacy-tools',
    name: 'csv-converter',
    description: 'Battle-tested CSV parsing library. Handles edge cases that break most parsers. 100% test coverage, zero dependencies.',
    language: 'javascript',
    stars: 12456,
    starDelta: 23,
    forks: 1834,
    topics: ['csv', 'parser', 'javascript', 'utilities'],
    category: 'web',
    oppType: 'abandoned',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=csv-converter',
    healthScore: 45,
    activity: [1,0,2,0,1,0,0,1,0,0,2,0,1,0,0,0,1,0,0,0,1,0,0,2,0,0,1,0,0,0],
    signals: [
      { type: 'warning', icon: 'ph-archive', text: 'No commits in last 180 days' },
      { type: 'negative', icon: 'ph-user-x', text: 'Maintainer unresponsive to issues' },
      { type: 'positive', icon: 'ph-star', text: 'High star count, strong community demand' },
      { type: 'neutral', icon: 'ph-git-fork', text: '340+ open forks with unmerged improvements' }
    ],
    busFactor: 0,
    forkOpportunity: 'Fork and maintain. Many unmerged PRs with valuable improvements. Strong candidate for community fork.',
    forkTags: ['fork-opportunity', 'maintenance', 'community', 'javascript'],
    opportunityPitch: '12k stars, zero maintainer. This is a community fork waiting to happen. 340+ forks already exist with unmerged improvements. Whoever steps up to maintain this becomes the de facto CSV parser for the JS ecosystem.',
    issues: [
      { num: 445, title: 'CVE-2024-XXXX: ReDoS in quoted field parsing', difficulty: 'medium', time: '4-6 hours', labels: ['security', 'critical'], url: '#' },
      { num: 448, title: 'Streaming parser hangs on malformed input', difficulty: 'hard', time: '1-2 days', labels: ['bug', 'critical'], url: '#' },
      { num: 451, title: '12 unmerged PRs with performance improvements', difficulty: 'medium', time: '1 week', labels: ['maintenance', 'community'], url: '#' },
      { num: 455, title: 'TypeScript type definitions outdated', difficulty: 'easy', time: '2-3 hours', labels: ['types', 'good-first-issue'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork the repo', detail: 'Create your own fork to become the new maintainer', icon: 'ph-git-fork' },
      { step: 2, title: 'Review open PRs', detail: '340+ unmerged PRs with valuable improvements', icon: 'ph-git-pull-request' },
      { step: 3, title: 'Fix critical issues', detail: 'Security patches and bug fixes first', icon: 'ph-shield-check' },
      { step: 4, title: 'Announce the fork', detail: 'Post on npm, Reddit, Twitter to gather community', icon: 'ph-megaphone' }
    ]
  },
  {
    id: 104,
    owner: 'welcomelab',
    name: 'docsify-cli',
    description: 'CLI tool for generating documentation sites. Markdown in, beautiful docs out. Plugins for API reference and changelogs.',
    language: 'typescript',
    stars: 4567,
    starDelta: 345,
    forks: 278,
    topics: ['documentation', 'cli', 'markdown', 'typescript'],
    category: 'devtools',
    oppType: 'firstpr',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=docsify-cli',
    healthScore: 76,
    activity: [4,6,3,7,5,8,4,6,3,7,5,8,4,6,3,7,5,8,4,6,3,7,5,8,4,6,3,7,5,8],
    signals: [
      { type: 'positive', icon: 'ph-hand-waving', text: '12 issues labeled good-first-issue' },
      { type: 'positive', icon: 'ph-book-open', text: 'Detailed contributing guide' },
      { type: 'positive', icon: 'ph-chat-circle', text: 'Responsive maintainer (avg 2 days)' },
      { type: 'neutral', icon: 'ph-code', text: 'TypeScript, beginner-friendly codebase' }
    ],
    busFactor: 4,
    forkOpportunity: 'Excellent for first-time contributors. Clear issue labels, helpful maintainer, well-documented codebase.',
    forkTags: ['good-first-issue', 'beginner-friendly', 'documentation', 'typescript'],
    opportunityPitch: 'The perfect first PR. 12 issues explicitly labeled good-first-issue, a maintainer who responds within 2 days, and a TypeScript codebase that reads like a tutorial. Start your open source journey here.',
    issues: [
      { num: 201, title: 'Add --watch flag for live reload', difficulty: 'easy', time: '3-4 hours', labels: ['good-first-issue', 'enhancement'], url: '#' },
      { num: 208, title: 'Support custom themes directory', difficulty: 'easy', time: '2-3 hours', labels: ['good-first-issue', 'enhancement'], url: '#' },
      { num: 215, title: 'Fix sidebar scroll position on page change', difficulty: 'easy', time: '1-2 hours', labels: ['good-first-issue', 'bug'], url: '#' },
      { num: 223, title: 'Add mermaid diagram plugin', difficulty: 'medium', time: '1-2 days', labels: ['plugin', 'enhancement'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork and clone', detail: 'git clone your-fork && cd docsify-cli', icon: 'ph-git-fork' },
      { step: 2, title: 'Install', detail: 'npm install && npm run build', icon: 'ph-package' },
      { step: 3, title: 'Run dev server', detail: 'npm run dev -- --open', icon: 'ph-play' },
      { step: 4, title: 'Pick a good-first-issue', detail: 'Filter by label on the Issues tab', icon: 'ph-flag' }
    ]
  },
  {
    id: 113,
    owner: 'Leonxlnx',
    name: 'taste-skill',
    description: 'Opinionated design guidelines, instruction files, and anti-slop rules to improve the aesthetic quality of AI-generated frontends.',
    language: 'markdown',
    stars: 12560,
    starDelta: 2432,
    forks: 812,
    topics: ['design-system', 'anti-slop', 'frontend', 'ai-instructions'],
    category: 'web',
    oppType: 'design',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=taste-skill',
    healthScore: 92,
    activity: [7, 9, 8, 12, 10, 11, 9, 8, 7, 10, 14, 12, 11, 9, 13, 10, 11, 8, 9, 7, 12, 10, 14, 11, 9, 13, 12, 11, 9, 10],
    signals: [
      { type: 'positive', icon: 'ph-trend-up', text: 'Viral growth, featured on GitHub Trending' },
      { type: 'positive', icon: 'ph-paint-brush', text: 'Clear contribution instructions for designer-coders' },
      { type: 'warning', icon: 'ph-warning', text: 'Needs clean CSS / Tailwind v4 specific skill manuals' },
      { type: 'neutral', icon: 'ph-globe', text: 'Used across 2,000+ active workspaces' }
    ],
    busFactor: 4,
    forkOpportunity: 'Contribute clean, detailed skill manuals for modern frontend stacks (e.g. Tailwind v4, Motion, fluid typography).',
    forkTags: ['documentation', 'design-system', 'tailwind-v4', 'markdown'],
    opportunityPitch: 'This project is single-handedly redefining how developers steer AI design, yet it lacks comprehensive manuals for Tailwind v4 and fluid typography. Contributing these puts your design-engineering skills in front of thousands of top-tier builders.',
    opportunityGap: 'The library lacks dedicated anti-slop rules and implementation guidelines for modern CSS utility libraries like Tailwind v4. The documentation is currently open for community blueprints.',
    opportunityTargetAreas: 'Create a new skill folder under `.agents/skills/tailwind-v4/SKILL.md` detailing display font-sizes, vertical height safeguards, and scrollbar refractions.',
    opportunityROI: 'Establish yourself as a key authority in prompt engineering and modern design systems. Your manual will be read by AI coding agents across the global tech community.',
    issues: [
      { num: 45, title: 'Write a comprehensive skill manual for Tailwind v4 best practices', difficulty: 'medium', time: '1-2 days', labels: ['skills', 'tailwind-v4'], url: '#' },
      { num: 52, title: 'Design elegant templates for image-to-code wireframes', difficulty: 'easy', time: '4-6 hours', labels: ['design', 'good-first-issue'], url: '#' },
      { num: 58, title: 'Create interactive HTML/CSS visualization tool for the Three Dials', difficulty: 'hard', time: '3-5 days', labels: ['creative-coding', 'js'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork and clone', detail: 'git clone your-fork && cd taste-skill', icon: 'ph-git-fork' },
      { step: 2, title: 'Review open PRs', detail: 'Check the #skills channel on community platforms', icon: 'ph-chat-circle' },
      { step: 3, title: 'Draft your manual', detail: 'Create SKILL.md under your target stack folder', icon: 'ph-note' },
      { step: 4, title: 'Submit pull request', detail: 'Submit with description of the design metrics solved', icon: 'ph-git-pull-request' }
    ]
  },
  {
    id: 114,
    owner: 'tailwind-deck',
    name: 'core',
    description: 'Modern Tailwind v4 React components with premium aesthetics, micro-interactions, and built-in HSL color token system.',
    language: 'typescript',
    stars: 8321,
    starDelta: 943,
    forks: 412,
    topics: ['tailwind', 'react', 'ui-components', 'design-system'],
    category: 'web',
    oppType: 'design',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=core',
    healthScore: 84,
    activity: [5, 6, 7, 5, 8, 9, 6, 7, 5, 8, 7, 6, 8, 7, 9, 6, 7, 8, 5, 6, 8, 7, 9, 8, 6, 7, 9, 8, 7, 8],
    signals: [
      { type: 'positive', icon: 'ph-sparkles', text: 'Highly praised aesthetic foundation' },
      { type: 'warning', icon: 'ph-palette', text: 'Dark mode contrast transitions are uncalibrated' },
      { type: 'warning', icon: 'ph-device-mobile', text: 'Layout shifts observed on responsive mobile header' },
      { type: 'neutral', icon: 'ph-hand-pointing', text: 'Built on Tailwind v4 CSS layer rules' }
    ],
    busFactor: 3,
    forkOpportunity: 'Help refactor core components to Tailwind v4, add sleek micro-animations, and implement a consistent dark mode theme.',
    forkTags: ['design-system', 'tailwind-v4', 'micro-animations', 'typescript'],
    opportunityPitch: 'A highly functional competitor to shadcn/ui that lacks premium, fluid visual refinement. Injecting double-border refraction styling, responsive grid scaling, and clip-path transitions here will instantly make this a top-tier designer tool.',
    opportunityGap: 'Responsive navigation menu collapses awkwardly on viewports below 480px, causing significant layout shift. In addition, the dark-mode layout transitions are currently abrupt.',
    opportunityTargetAreas: 'Refactor `src/components/layout/Navbar.tsx` responsive classes and implement a spring-based dark mode toggle in `src/components/theme/ThemeToggle.tsx`.',
    opportunityROI: 'Enhance your portfolio with highly-polished, state-of-the-art interactive components. Showcase advanced responsive engineering and spring-physics easing curves.',
    issues: [
      { num: 45, title: 'Design & implement interactive glassmorphic dashboard sidebar', difficulty: 'medium', time: '1-2 days', labels: ['design', 'tailwind-v4', 'good-first-issue'], url: '#' },
      { num: 48, title: 'Add layout transitions for the multi-step multi-select wizard', difficulty: 'medium', time: '2-3 days', labels: ['design', 'framer-motion'], url: '#' },
      { num: 52, title: 'Implement dark mode toggle transition effect using CSS clip-path', difficulty: 'easy', time: '4-6 hours', labels: ['design', 'good-first-issue'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork and clone', detail: 'git clone your-fork && cd core', icon: 'ph-git-fork' },
      { step: 2, title: 'Install and run storyboard', detail: 'npm install && npm run storybook', icon: 'ph-package' },
      { step: 3, title: 'Pick a styling issue', detail: 'Start with issues labeled design or good-first-issue', icon: 'ph-flag' },
      { step: 4, title: 'Test responsive grids', detail: 'Ensure viewport stability from 320px to 4k', icon: 'ph-device-mobile' }
    ]
  },
  {
    id: 115,
    owner: 'glassmorphism',
    name: 'charts',
    description: 'Modern SVG and Canvas charting library with fluid animations, glowing gradients, and accessible tooltips.',
    language: 'typescript',
    stars: 5612,
    starDelta: 532,
    forks: 289,
    topics: ['charts', 'svg', 'canvas', 'web-design', 'visualization'],
    category: 'web',
    oppType: 'design',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=charts',
    healthScore: 79,
    activity: [3, 4, 2, 5, 4, 3, 6, 5, 4, 7, 5, 4, 3, 6, 5, 7, 4, 5, 6, 5, 4, 7, 6, 5, 8, 4, 6, 5, 7, 6],
    signals: [
      { type: 'positive', icon: 'ph-chart-bar', text: 'Exceptionally fast render times via HTML5 Canvas' },
      { type: 'warning', icon: 'ph-eye-closed', text: 'Screen-reader (a11y) contrast issues open' },
      { type: 'warning', icon: 'ph-gradient', text: 'Lacks modern neon radial gradients' },
      { type: 'neutral', icon: 'ph-users-three', text: 'Active team of 3 main developers' }
    ],
    busFactor: 4,
    forkOpportunity: 'Improve visual aesthetics by adding hover state transformations, premium glowing line gradients, and resolving contrast issues.',
    forkTags: ['charts', 'svg', 'accessibility', 'glowing-gradients'],
    opportunityPitch: 'Help solo builders present data beautifully. The library renders incredibly fast, but tooltips and interactive hover effects lack visual depth. Adding neon radial glows and fluid transitions will immediately elevate thousands of analytical dashboards.',
    opportunityGap: 'Bar heights jump statically when dataset shifts, instead of executing spring-based transitions. Hover states on line charts lack a subtle glowing backdrop gradient.',
    opportunityTargetAreas: 'Edit `src/renderer/svg/BarRenderer.ts` and `src/components/tooltip/TooltipOverlay.tsx` to add radial gradient support and CSS ease-out styling.',
    opportunityROI: 'Master mathematical SVG coordinates and canvas rendering. Showcase complex mathematical animations combined with premium user experience polish.',
    issues: [
      { num: 124, title: 'Add glowing radial gradient background behind line charts on hover', difficulty: 'easy', time: '4-6 hours', labels: ['design', 'svg', 'good-first-issue'], url: '#' },
      { num: 131, title: 'Create smooth elastic bar height transitions on data changes', difficulty: 'medium', time: '1-2 days', labels: ['design', 'animation'], url: '#' },
      { num: 138, title: 'Resolve contrast ratios for dark/light mode tooltip text (a11y)', difficulty: 'easy', time: '2-3 hours', labels: ['accessibility', 'good-first-issue'], url: '#' }
    ],
    contributionGuide: [
      { step: 1, title: 'Fork and clone', detail: 'git clone your-fork && cd charts', icon: 'ph-git-fork' },
      { step: 2, title: 'Install and run dev server', detail: 'pnpm install && pnpm dev', icon: 'ph-package' },
      { step: 3, title: 'Review Figma spec in README', detail: 'Review target design for tooltip visual layouts', icon: 'ph-figma-logo' },
      { step: 4, title: 'Test contrast', detail: 'Verify tooltip readability with color contrast tools', icon: 'ph-shield-check' }
    ]
  }
];

// Helper to seed database if empty
async function seedDatabase() {
  try {
    const countResult = await db.execute('SELECT COUNT(*) as count FROM repositories');
    const count = countResult.rows[0]?.count as number ?? 0;
    
    if (count === 0) {
      console.log('Seeding GitScout cache database...');
      const statements: any[] = [];

      const buildInsertRepo = (repo: any) => {
        // Generate realistic deterministic trend data for charts to make standard visual line charts render gorgeously!
        const months = ['Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];
        const commitMonths = ['Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];
        
        const seed = repo.id;
        const getSeedVal = (i: number, base: number) => {
          return Math.floor(base + Math.sin(seed + i) * (base * 0.25));
        };

        const starHistory = months.map((_, idx) => {
          const start = repo.stars - (repo.starDelta || 500);
          const step = (repo.starDelta || 500) / 5;
          return Math.floor(start + idx * step + Math.sin(seed + idx) * 100);
        });

        const commitHistory = commitMonths.map((_, idx) => getSeedVal(idx, repo.healthScore ? repo.healthScore * 0.6 : 35));

        const openIssuesCount = repo.issues ? repo.issues.length : Math.floor(10 + Math.sin(seed) * 5);
        const closedIssuesCount = Math.floor(openIssuesCount * (repo.healthScore ? repo.healthScore / 60 : 1.2));
        const totalIssues = openIssuesCount + closedIssuesCount;
        const issuesRatio = {
          open: openIssuesCount,
          closed: closedIssuesCount,
          total: totalIssues,
          rate: Math.round((closedIssuesCount / totalIssues) * 100)
        };

        const trendData = {
          months,
          starHistory,
          commitMonths,
          commitHistory,
          issuesRatio
        };

        // Deterministic creation timestamp distributed over the last 240 days
        const getCreatedAt = (id: number) => {
          const daysAgo = (id * 17) % 240;
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          return date.toISOString();
        };
        const created_at = repo.created_at || getCreatedAt(repo.id);

        statements.push({
          sql: `
            INSERT INTO repositories (
              id, owner, name, description, language, stars, starDelta, forks, topics, category,
              oppType, avatar, healthScore, activity, signals, busFactor, forkOpportunity, forkTags,
              opportunityPitch, opportunityGap, opportunityTargetAreas, opportunityROI, issues, contributionGuide, trendData, created_at
            ) VALUES (
              :id, :owner, :name, :description, :language, :stars, :starDelta, :forks, :topics, :category,
              :oppType, :avatar, :healthScore, :activity, :signals, :busFactor, :forkOpportunity, :forkTags,
              :opportunityPitch, :opportunityGap, :opportunityTargetAreas, :opportunityROI, :issues, :contributionGuide, :trendData, :created_at
            )
          `,
          args: {
            id: repo.id,
            owner: repo.owner,
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stars,
            starDelta: repo.starDelta || 100,
            forks: repo.forks,
            topics: JSON.stringify(repo.topics || []),
            category: repo.category || 'all',
            oppType: repo.oppType || null,
            avatar: repo.avatar,
            healthScore: repo.healthScore || null,
            activity: JSON.stringify(repo.activity || []),
            signals: JSON.stringify(repo.signals || []),
            busFactor: repo.busFactor || null,
            forkOpportunity: repo.forkOpportunity || null,
            forkTags: JSON.stringify(repo.forkTags || []),
            opportunityPitch: repo.opportunityPitch || null,
            opportunityGap: repo.opportunityGap || null,
            opportunityTargetAreas: repo.opportunityTargetAreas || null,
            opportunityROI: repo.opportunityROI || null,
            issues: JSON.stringify(repo.issues || []),
            contributionGuide: JSON.stringify(repo.contributionGuide || []),
            trendData: JSON.stringify(trendData),
            created_at
          }
        });
      };

      initialTrending.forEach(buildInsertRepo);
      initialOpportunities.forEach(buildInsertRepo);

      return db.batch(statements, 'write');
    }
  } catch (error: any) {
    console.error('Error during database seeding:', error.message);
  }
}

// API ENDPOINTS

// 1. Get Trending Repositories
app.get('/api/trending', async (req, res) => {
  const { category, search, language } = req.query;
  let query = 'SELECT * FROM repositories WHERE oppType IS NULL';
  const params: any[] = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (language && language !== 'all') {
    query += ' AND LOWER(language) = ?';
    params.push((language as string).toLowerCase());
  }
  if (search) {
    query += ' AND (name LIKE ? OR owner LIKE ? OR description LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY stars DESC';

  try {
    const result = await db.execute({ sql: query, args: params });
    const repos = result.rows;
    const parsedRepos = repos.map((repo: any) => ({
      ...repo,
      topics: JSON.parse(repo.topics as string || '[]'),
      activity: JSON.parse(repo.activity as string || '[]'),
      signals: JSON.parse(repo.signals as string || '[]'),
      forkTags: JSON.parse(repo.forkTags as string || '[]'),
      issues: JSON.parse(repo.issues as string || '[]'),
      contributionGuide: JSON.parse(repo.contributionGuide as string || '[]'),
      trendData: JSON.parse(repo.trendData as string || 'null')
    }));
    res.json(parsedRepos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Opportunity Repositories
app.get('/api/opportunities', async (req, res) => {
  const { oppType, category, search, language } = req.query;
  let query = 'SELECT * FROM repositories WHERE oppType IS NOT NULL';
  const params: any[] = [];

  if (oppType && oppType !== 'all') {
    query += ' AND oppType = ?';
    params.push(oppType);
  }
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (language && language !== 'all') {
    query += ' AND LOWER(language) = ?';
    params.push((language as string).toLowerCase());
  }
  if (search) {
    query += ' AND (name LIKE ? OR owner LIKE ? OR description LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY healthScore DESC, stars DESC';

  try {
    const result = await db.execute({ sql: query, args: params });
    const repos = result.rows;
    const parsedRepos = repos.map((repo: any) => ({
      ...repo,
      topics: JSON.parse(repo.topics as string || '[]'),
      activity: JSON.parse(repo.activity as string || '[]'),
      signals: JSON.parse(repo.signals as string || '[]'),
      forkTags: JSON.parse(repo.forkTags as string || '[]'),
      issues: JSON.parse(repo.issues as string || '[]'),
      contributionGuide: JSON.parse(repo.contributionGuide as string || '[]'),
      trendData: JSON.parse(repo.trendData as string || 'null')
    }));
    res.json(parsedRepos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Specific Repository Deep Details
app.get('/api/opportunities/:owner/:name', async (req, res) => {
  const { owner, name } = req.params;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM repositories WHERE LOWER(owner) = ? AND LOWER(name) = ?',
      args: [owner.toLowerCase(), name.toLowerCase()]
    });
    const repo = result.rows[0] as any;
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found in database.' });
    }

    const parsedRepo = {
      ...repo,
      topics: JSON.parse(repo.topics as string || '[]'),
      activity: JSON.parse(repo.activity as string || '[]'),
      signals: JSON.parse(repo.signals as string || '[]'),
      forkTags: JSON.parse(repo.forkTags as string || '[]'),
      issues: JSON.parse(repo.issues as string || '[]'),
      contributionGuide: JSON.parse(repo.contributionGuide as string || '[]'),
      trendData: JSON.parse(repo.trendData as string || 'null')
    };
    res.json(parsedRepo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Trigger Scan / Sync with GitHub REST API
app.post('/api/scan', async (req, res) => {
  try {
    console.log('Initiating active GitScout GitHub API scout...');
    
    const searchQueries = [
      'q=topic:ai-agent+stars:>200&sort=updated&order=desc',
      'q=topic:llm+stars:>300&sort=updated&order=desc',
      'q=topic:langchain+stars:>100&sort=updated&order=desc'
    ];
    
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    const githubUrl = `https://api.github.com/search/repositories?${randomQuery}&per_page=15`;
    
    const headers: any = {};
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    const response = await axios.get(githubUrl, { headers, timeout: 8000 });
    const items = response.data.items || [];
    
    const updatedRepos: any[] = [];
    
    for (const item of items) {
      const id = item.id;
      const owner = item.owner.login;
      const name = item.name;
      const description = item.description || 'No description provided.';
      const language = item.language || 'typescript';
      const stars = item.stargazers_count;
      const forks = item.forks_count;
      const topics = item.topics || [];
      const avatar = item.owner.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`;
      
      const existingResult = await db.execute({
        sql: 'SELECT * FROM repositories WHERE owner = ? AND name = ?',
        args: [owner, name]
      });
      const existing = existingResult.rows[0] as any;
      
      if (existing) {
        // Update existing repository
        await db.execute({
          sql: 'UPDATE repositories SET description = ?, stars = ?, forks = ?, topics = ?, avatar = ? WHERE id = ?',
          args: [description, stars, forks, JSON.stringify(topics), avatar, existing.id]
        });
        console.log(`Updated existing repository: ${owner}/${name}`);
        updatedRepos.push({
          ...existing,
          description,
          stars,
          forks,
          topics,
          avatar
        });
      } else {
        // Synthesize high-quality opportunity evaluation vectors
        const seed = id;
        const healthScore = Math.floor(65 + (Math.sin(seed) * 25));
        const oppTypes: ('rising' | 'bounty' | 'abandoned' | 'firstpr' | 'design')[] = ['rising', 'bounty', 'firstpr', 'design'];
        const oppType = oppTypes[Math.floor((Math.sin(seed) + 1) * 2) % oppTypes.length];
        
        const activity = Array.from({ length: 30 }, (_, idx) => Math.floor(2 + (Math.sin(seed + idx) + 1) * 4));
        const busFactor = Math.floor(2 + (Math.sin(seed) + 1) * 2);
        
        const signals = [
          { type: 'positive', icon: 'ph-star', text: `Fast growing adoption with ${stars} stars` },
          { type: 'warning', icon: 'ph-users', text: `Managed by a core group of ${busFactor} maintainers` },
          { type: 'neutral', icon: 'ph-code', text: `Primary stack is ${language}` }
        ];
        
        const forkTags = ['good-first-issue', language.toLowerCase(), 'documentation'];
        const forkOpportunity = `Contribute optimization patches for ${language} execution patterns or expand documentation coverage.`;
        const opportunityPitch = `This scanned project ${owner}/${name} is showing excellent momentum in the ${language} community. Early contribution or technical staging will unlock unique positioning.`;
        
        const issues = [
          { num: 12, title: 'Improve unit tests coverage', difficulty: 'easy', time: '2-4 hours', labels: ['good-first-issue', 'tests'], url: item.html_url + '/issues' },
          { num: 15, title: `Refactor core modules in ${language}`, difficulty: 'medium', time: '1-2 days', labels: ['enhancement'], url: item.html_url + '/issues' },
        ];
        
        const contributionGuide = [
          { step: 1, title: 'Fork and clone', detail: `git clone your-fork && cd ${name}`, icon: 'ph-git-fork' },
          { step: 2, title: 'Install development packages', detail: 'pnpm install || npm install', icon: 'ph-package' },
          { step: 3, title: 'Read issues board', detail: 'Check the good-first-issue tag first', icon: 'ph-flag' }
        ];
        
        const months = ['Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];
        const commitMonths = ['Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];
        
        const starHistory = months.map((_, idx) => Math.floor((stars * 0.7) + idx * (stars * 0.05)));
        const commitHistory = commitMonths.map((_, idx) => Math.floor(10 + (Math.sin(seed + idx) + 1) * 15));
        
        const issuesRatio = {
          open: issues.length,
          closed: Math.floor(issues.length * 1.5),
          total: issues.length + Math.floor(issues.length * 1.5),
          rate: 60
        };
        
        const trendData = {
          months,
          starHistory,
          commitMonths,
          commitHistory,
          issuesRatio
        };
        
        const newRepo = {
          id,
          owner,
          name,
          description,
          language,
          stars,
          starDelta: Math.floor(stars * 0.05),
          forks,
          topics: JSON.stringify(topics),
          category: 'ai',
          oppType,
          avatar,
          healthScore,
          activity: JSON.stringify(activity),
          signals: JSON.stringify(signals),
          busFactor,
          forkOpportunity,
          forkTags: JSON.stringify(forkTags),
          opportunityPitch,
          opportunityGap: 'Requires performance tuning on asynchronous operations.',
          opportunityTargetAreas: 'Enhance file I/O operations and visual UI overlays.',
          opportunityROI: 'Expand visibility within the growing AI-agent developer sphere.',
          issues: JSON.stringify(issues),
          contributionGuide: JSON.stringify(contributionGuide),
          trendData: JSON.stringify(trendData)
        };
        
        await db.execute({
          sql: `
            INSERT INTO repositories (
              id, owner, name, description, language, stars, starDelta, forks, topics, category,
              oppType, avatar, healthScore, activity, signals, busFactor, forkOpportunity, forkTags,
              opportunityPitch, opportunityGap, opportunityTargetAreas, opportunityROI, issues, contributionGuide, trendData
            ) VALUES (
              :id, :owner, :name, :description, :language, :stars, :starDelta, :forks, :topics, :category,
              :oppType, :avatar, :healthScore, :activity, :signals, :busFactor, :forkOpportunity, :forkTags,
              :opportunityPitch, :opportunityGap, :opportunityTargetAreas, :opportunityROI, :issues, :contributionGuide, :trendData
            )
          `,
          args: {
            id: newRepo.id,
            owner: newRepo.owner,
            name: newRepo.name,
            description: newRepo.description,
            language: newRepo.language,
            stars: newRepo.stars,
            starDelta: newRepo.starDelta,
            forks: newRepo.forks,
            topics: newRepo.topics,
            category: newRepo.category,
            oppType: newRepo.oppType,
            avatar: newRepo.avatar,
            healthScore: newRepo.healthScore,
            activity: newRepo.activity,
            signals: newRepo.signals,
            busFactor: newRepo.busFactor,
            forkOpportunity: newRepo.forkOpportunity,
            forkTags: newRepo.forkTags,
            opportunityPitch: newRepo.opportunityPitch,
            opportunityGap: newRepo.opportunityGap,
            opportunityTargetAreas: newRepo.opportunityTargetAreas,
            opportunityROI: newRepo.opportunityROI,
            issues: newRepo.issues,
            contributionGuide: newRepo.contributionGuide,
            trendData: newRepo.trendData
          }
        });
        
        console.log(`Inserted new scanned repository: ${owner}/${name}`);
        updatedRepos.push({
          ...newRepo,
          topics,
          activity,
          signals,
          forkTags,
          issues,
          contributionGuide,
          trendData
        });
      }
    }
    
    res.json({ message: 'Active scan completed!', scannedCount: items.length, repositories: updatedRepos });
  } catch (error: any) {
    console.error('Scan Error:', error.message);
    res.status(500).json({ error: 'GitHub API limit or Timeout. Please try again shortly or review logs.' });
  }
});

export default app;
