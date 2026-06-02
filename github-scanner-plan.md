# GitScout — 2 Sites Plan

## Design Read (taste-skill §0.B)

> **Site 1 — GitHub Trending:** Reading this as: developer tool / data discovery platform for technical users, with a dark-tech editorial language, leaning toward Tailwind v4 + Geist + restrained motion.

> **Site 2 — Opportunity Scout:** Reading this as: developer analytics / opportunity scout for solo builders, with a clean utilitarian language, leaning toward Tailwind v4 + Geist Mono + bento data-grids.

## Three Dials (taste-skill §1)

| Dial | Trending | Opportunity |
|------|----------|-------------|
| DESIGN_VARIANCE | 6 (dev tool, clean but modern) | 7 (bento grids, asymmetric data cards) |
| MOTION_INTENSITY | 4 (subtle hover, stagger reveal) | 5 (scroll reveal, data transitions) |
| VISUAL_DENSITY | 5 (feed of repos, moderate) | 6 (analytics, metrics, dense data) |

## Stack

- **Framework:** React + Vite (SPA, no SSR needed — pure client-side GitHub API calls)
- **Styling:** Tailwind v4
- **Animation:** Motion (framer-motion) — lightweight scroll reveals
- **Icons:** Phosphor Icons (@phosphor-icons/react)
- **Font:** Geist Sans + Geist Mono (self-hosted via @font-face)
- **State:** Zustand (lightweight)
- **Data fetching:** TanStack Query v5 (GitHub REST API, no auth for public repos — 60 req/hr limit, fine for demo)
- **Routing:** React Router v6

## Color System (dark tech)

```
--bg-primary:    #0a0a0f       (near-black)
--bg-surface:    #12121a       (card surface)
--bg-elevated:   #1a1a25       (elevated cards)
--border:        #1e1e2e       (subtle borders)
--text-primary:  #e4e4e7       (zinc-200)
--text-secondary:#71717a       (zinc-500)
--text-muted:    #52525b       (zinc-600)
--accent:        #6366f1       (indigo-500 — single accent)
--accent-soft:   rgba(99,102,241,0.12)
--success:       #22c55e       (green for growth)
--warning:       #eab308       (yellow for attention)
--danger:        #ef4444       (red for decline)
```

**Rule:** One accent color (indigo). All status colors are semantic. No purple AI slop — indigo is intentional, not default purple gradient.

---

## Site 1: GitHub Trending (`/trending`)

### Features
1. **Trending Feed** — Real-time trending repos from GitHub
2. **Category Filters** — Chips: AI/ML, Web Dev, DevTools, CLI, Mobile, Data, Infra, Security, Game
3. **Language Filter** — Dropdown: Python, TypeScript, Rust, Go, Java, C++, etc.
4. **Time Range** — Today, This Week, This Month
5. **Keyword Search** — Full-text search across repo name + description
6. **Sort** — Stars, Forks, Recently Updated, Stars velocity
7. **Repo Card** — Name, description, language badge, stars, forks, star delta, topics, last updated

### Layout

```
┌─────────────────────────────────────────────┐
│  NAV: Logo · Trending · Opportunities · GitHub │
├─────────────────────────────────────────────┤
│  HERO (compact): "Discover what's trending"  │
│  [Search bar] [Category chips] [Filters]      │
├─────────────────────────────────────────────┤
│  GRID: 2-col on desktop, 1-col mobile         │
│  ┌──────────┐ ┌──────────┐                    │
│  │ Repo Card │ │ Repo Card │                    │
│  │ ★ 12.3k  │ │ ★ 8.7k   │                    │
│  │ ▲ +2.1k  │ │ ▲ +890   │                    │
│  └──────────┘ └──────────┘                    │
│  ... infinite scroll / load more ...           │
└─────────────────────────────────────────────┘
```

### Repo Card Design
- **Left:** Avatar (40px rounded) + full_name
- **Description:** max 2 lines, text-secondary
- **Topics:** pill badges (desaturated pastel on dark)
- **Stats row:** ★ stars · ▲ star_delta · fork · language badge · updated
- **Hover:** subtle border glow (accent-soft), translateY(-2px)
- **Link:** opens GitHub repo in new tab

### API Strategy
- GitHub Search API: `GET /search/repositories?q=topic:ai+created:>2026-05-01&sort=stars&order=desc`
- Trending logic: query repos created in last N days, sort by stars
- Fallback: scrape github.com/trending (HTML parsing) for star-delta data

---

## Site 2: GitHub Opportunity (`/opportunities`)

### Features
1. **Opportunity Scanner** — Find repos with high potential signals
2. **Opportunity Types:**
   - 🔥 **Rising Stars** — New repos (< 6 months) with rapid star growth
   - 🐛 **Issue Bounty** — Repos with many open issues, low contributor count
   - 💤 **Abandoned Gold** — Popular repos (> 1k stars) with no updates in 6+ months
   - 🌱 **First PR Friendly** — Has "good first issue" label, welcoming docs
   - 📦 **Dependency Gap** — Popular repos missing features (via issue analysis)
3. **Filters:** Language, Stars range, Age range, Opportunity type
4. **Repo Deep Analysis (click into repo):**
   - Overview card (name, desc, stats)
   - **Health Score** — composite metric (commit frequency, issue response time, PR merge rate, contributor activity)
   - **Activity Timeline** — commits/issues/PRs over time (mini sparkline)
   - **Contributor Analysis** — top contributors, bus factor
   - **Issue Categories** — cluster issues by label/topic
   - **Fork Analysis** — fork count, active forks diverging
   - **Dependency Graph** — what it depends on, what depends on it
   - **Opportunity Signals** — "3 good-first-issues open", "last commit 8 months ago", "only 2 active maintainers"

### Layout — List View
```
┌─────────────────────────────────────────────┐
│  NAV: Logo · Trending · Opportunities        │
├─────────────────────────────────────────────┤
│  "Find your next opportunity"                 │
│  [Type chips: Rising · Issues · Abandoned · FirstPR] │
│  [Language ▾] [Stars ▾] [Age ▾] [Search]     │
├─────────────────────────────────────────────┤
│  BENTO GRID:                                  │
│  ┌──────────────────┐ ┌────────┐              │
│  │ Repo + Score      │ │ Quick  │              │
│  │ ★ 5.2k · Health 72│ │ Stats  │              │
│  │ ▲ Rising Fast     │ │        │              │
│  └──────────────────┘ └────────┘              │
│  ...                                          │
└─────────────────────────────────────────────┘
```

### Layout — Detail View (`/opportunities/:owner/:repo`)
```
┌─────────────────────────────────────────────┐
│  ← Back to Opportunities                     │
│  REPO NAME · owner/repo                      │
│  ★ 12.3k · Fork 890 · MIT · TypeScript       │
├─────────────────────────────────────────────┤
│  BENTO ANALYSIS GRID:                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Health   │ │ Activity │ │ Bus      │      │
│  │ Score    │ │ Timeline │ │ Factor   │      │
│  │    72    │ │ [sparkl] │ │    3     │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│  ┌─────────────────────┐ ┌──────────┐        │
│  │ Open Issues          │ │ Top      │        │
│  │ by category          │ │ Contrib. │        │
│  └─────────────────────┘ └──────────┘        │
│  ┌──────────────────────────────────┐        │
│  │ Opportunity Signals               │        │
│  │ • 5 good-first-issues             │        │
│  │ • Last commit: 8 months ago       │        │
│  │ • Only 2 active maintainers       │        │
│  └──────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

### Health Score Algorithm
```
health_score = (
  commit_frequency * 0.25 +      // commits per month (normalized)
  issue_response * 0.20 +        // median time to first response
  pr_merge_rate * 0.20 +         // merged PRs / total PRs
  contributor_diversity * 0.15 + // unique contributors per month
  release_frequency * 0.10 +     // releases per quarter
  documentation_score * 0.10     // has README, CONTRIBUTING, LICENSE
) * 100
```

### API Calls per Repo Analysis
```
GET /repos/{owner}/{repo}                    — metadata
GET /repos/{owner}/{repo}/stats/contributors — contributor stats
GET /repos/{owner}/{repo}/stats/commit_activity — weekly commits
GET /repos/{owner}/{repo}/issues?state=open  — open issues
GET /repos/{owner}/{repo}/pulls?state=all    — PR stats
GET /repos/{owner}/{repo}/releases           — release frequency
GET /repos/{owner}/{repo}/community/profile  — community health
```

---

## Project Structure

```
github-scanner/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   └── fonts/           # Geist Sans + Mono
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css        # Tailwind + font-face + custom vars
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterChips.tsx
│   │   │   ├── LanguageSelect.tsx
│   │   │   ├── StatsBadge.tsx
│   │   │   ├── HealthScore.tsx
│   │   │   ├── Sparkline.tsx
│   │   │   └── SkeletonCard.tsx
│   │   ├── trending/
│   │   │   ├── TrendingPage.tsx
│   │   │   ├── TrendingCard.tsx
│   │   │   └── TrendingGrid.tsx
│   │   └── opportunity/
│   │       ├── OpportunityPage.tsx
│   │       ├── OpportunityCard.tsx
│   │       ├── OpportunityGrid.tsx
│   │       └── RepoAnalysis.tsx
│   ├── hooks/
│   │   ├── useGitHubSearch.ts
│   │   ├── useTrending.ts
│   │   ├── useOpportunities.ts
│   │   └── useRepoAnalysis.ts
│   ├── services/
│   │   └── github.ts    # GitHub API client
│   ├── stores/
│   │   └── filters.ts   # Zustand filter state
│   ├── types/
│   │   └── github.ts    # TypeScript interfaces
│   └── utils/
│       ├── health-score.ts
│       └── formatters.ts
```

---

## Implementation Order

1. **Phase 1 — Scaffold** (Vite + React + Tailwind + Router + fonts)
2. **Phase 2 — GitHub API service** (search, trending, repo details)
3. **Phase 3 — Site 1: Trending** (page, cards, filters, search)
4. **Phase 4 — Site 2: Opportunity List** (page, cards, type filters)
5. **Phase 5 — Site 2: Repo Analysis** (detail page, bento grid, health score)
6. **Phase 6 — Polish** (skeletons, error states, animations, responsive)

## Design Anti-Slop Rules (taste-skill compliance)

- ❌ No Inter font → Geist Sans + Mono
- ❌ No AI purple gradients → Indigo single accent
- ❌ No generic glassmorphism → Clean dark surfaces
- ❌ No centered hero → Left-aligned, compact
- ❌ No emojis in code → Phosphor icons only
- ❌ No placeholder names → Real repo data from GitHub API
- ❌ No generic spinners → Skeleton loaders matching layout
- ✅ Responsive grid (2-col → 1-col)
- ✅ Loading/empty/error states for every view
- ✅ Staggered scroll-reveal on card grids
- ✅ Hover micro-interactions (translateY, border glow)
