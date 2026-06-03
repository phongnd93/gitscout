import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import type { Client, InValue } from '@libsql/client';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DbRowRaw, Repository, OpportunityType, SignalItem, Issue, ContributionStep, TrendData, IssuesRatio } from '../src/types/github';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Turso database client (works with remote and local files)
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '../gitscout.db')}`;
const dbToken = process.env.TURSO_AUTH_TOKEN;

const db: Client = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// Middleware to ensure database is initialized before handling any request
const dbReady = initDatabase().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Database initialization crashed on startup:', message);
});

app.use(async (_req, _res, next) => {
  await dbReady;
  next();
});

// Parse a raw DB row into a Repository with JSON-parsed fields
function parseRepoRow(row: DbRowRaw): Repository {
  return {
    id: Number(row.id),
    owner: String(row.owner),
    name: String(row.name),
    description: String(row.description ?? ''),
    language: String(row.language ?? ''),
    stars: Number(row.stars ?? 0),
    starDelta: Number(row.starDelta ?? 0),
    forks: Number(row.forks ?? 0),
    topics: safelyParseJson<string[]>(row.topics, []),
    category: String(row.category ?? ''),
    oppType: (row.oppType || undefined) as OpportunityType | undefined,
    avatar: String(row.avatar ?? ''),
    healthScore: row.healthScore != null ? Number(row.healthScore) : undefined,
    activity: safelyParseJson<number[]>(row.activity, []),
    signals: safelyParseJson<SignalItem[]>(row.signals, []),
    busFactor: row.busFactor != null ? Number(row.busFactor) : undefined,
    forkOpportunity: row.forkOpportunity ?? undefined,
    forkTags: safelyParseJson<string[]>(row.forkTags, []),
    opportunityPitch: row.opportunityPitch ?? undefined,
    opportunityGap: row.opportunityGap ?? undefined,
    opportunityTargetAreas: row.opportunityTargetAreas ?? undefined,
    opportunityROI: row.opportunityROI ?? undefined,
    issues: safelyParseJson<Issue[]>(row.issues, []),
    contributionGuide: safelyParseJson<ContributionStep[]>(row.contributionGuide, []),
    trendData: safelyParseJson<TrendData | null>(row.trendData, null) ?? undefined,
  };
}

function safelyParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Async database schema and seed initializer
async function initDatabase(): Promise<void> {
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
    await migrateOppTypeDistribution();
    await seedDatabase();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error during database initialization:', message);
  }
}

// Retroactively apply 60/40 trending/opportunity split to existing repos that were all marked as opportunities
async function migrateOppTypeDistribution(): Promise<void> {
  try {
    const countResult = await db.execute("SELECT COUNT(*) as count FROM repositories WHERE oppType IS NOT NULL");
    const allOpportunityCount = Number(countResult.rows[0]?.count ?? 0);
    
    if (allOpportunityCount === 0) return;

    const reposResult = await db.execute("SELECT id FROM repositories WHERE oppType IS NOT NULL");
    const repos = reposResult.rows as unknown as { id: number }[];
    
    console.log(`Migrating oppType distribution for ${repos.length} repositories...`);
    
    const oppTypes: OpportunityType[] = ['rising', 'bounty', 'firstpr', 'design'];
    let migratedToTrending = 0;
    
    for (let i = 0; i < repos.length; i++) {
      const { id } = repos[i];
      const seed = id;
      const isOpportunity = (seed % 5) < 2;
      
      if (isOpportunity) {
        const newOppType = oppTypes[Math.floor((Math.sin(seed) + 1) * 2) % oppTypes.length];
        await db.execute({
          sql: 'UPDATE repositories SET oppType = ? WHERE id = ?',
          args: [newOppType, id]
        });
      } else {
        await db.execute({
          sql: 'UPDATE repositories SET oppType = NULL WHERE id = ?',
          args: [id]
        });
        migratedToTrending++;
      }
    }
    
    console.log(`Migration complete: ${migratedToTrending} repos moved to trending (oppType=NULL), ${repos.length - migratedToTrending} kept as opportunities`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Migration error:', message);
  }
}

const initialTrending: Repository[] = [];
const initialOpportunities: Repository[] = [];

async function seedDatabase(): Promise<void> {
  try {
    const countResult = await db.execute('SELECT COUNT(*) as count FROM repositories');
    const count = Number(countResult.rows[0]?.count ?? 0);

    if (count === 0) {
      console.log('Seeding GitScout cache database...');
      const statements: { sql: string; args: Record<string, InValue> }[] = [];

      const buildInsertRepo = (repo: Repository): void => {
        const months = ['Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];
        const commitMonths = ['Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];

        const seed = repo.id;
        const getSeedVal = (i: number, base: number): number => {
          return Math.floor(base + Math.sin(seed + i) * (base * 0.25));
        };

        const starHistory: number[] = months.map((_, idx) => {
          const start = repo.stars - (repo.starDelta || 500);
          const step = (repo.starDelta || 500) / 5;
          return Math.floor(start + idx * step + Math.sin(seed + idx) * 100);
        });

        const commitHistory: number[] = commitMonths.map((_, idx) => getSeedVal(idx, repo.healthScore ? repo.healthScore * 0.6 : 35));

        const openIssuesCount = repo.issues ? repo.issues.length : Math.floor(10 + Math.sin(seed) * 5);
        const closedIssuesCount = Math.floor(openIssuesCount * (repo.healthScore ? repo.healthScore / 60 : 1.2));
        const totalIssues = openIssuesCount + closedIssuesCount;
        const issuesRatio: IssuesRatio = {
          open: openIssuesCount,
          closed: closedIssuesCount,
          total: totalIssues,
          rate: Math.round((closedIssuesCount / totalIssues) * 100)
        };

        const trendData: TrendData = {
          months,
          starHistory,
          commitMonths,
          commitHistory,
          issuesRatio
        };

        const getCreatedAt = (id: number): string => {
          const daysAgo = (id * 17) % 240;
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          return date.toISOString();
        };
        const created_at = getCreatedAt(repo.id);

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

      await db.batch(statements, 'write');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error during database seeding:', message);
  }
}

// ========== Shared helper: process a repo item into DB (insert or update) ==========
interface GitHubRepoItem {
  id: number;
  owner: { login: string; avatar_url: string };
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  html_url: string;
}

async function processRepoItem(item: GitHubRepoItem): Promise<Repository> {
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
  const existing = existingResult.rows[0] as unknown as DbRowRaw | undefined;

  if (existing) {
    await db.execute({
      sql: 'UPDATE repositories SET description = ?, stars = ?, forks = ?, topics = ?, avatar = ? WHERE id = ?',
      args: [description, stars, forks, JSON.stringify(topics), avatar, existing.id]
    });
    console.log(`Updated existing repository: ${owner}/${name}`);
    return {
      ...parseRepoRow(existing),
      description,
      stars,
      forks,
      topics,
      avatar
    };
  }

  const seed = id;
  const healthScore = Math.floor(65 + (Math.sin(seed) * 25));
  const isOpportunity = (seed % 5) < 2;
  const oppTypes: OpportunityType[] = ['rising', 'bounty', 'firstpr', 'design'];
  const oppType: OpportunityType | null = isOpportunity
    ? oppTypes[Math.floor((Math.sin(seed) + 1) * 2) % oppTypes.length]
    : null;

  const activity: number[] = Array.from({ length: 30 }, (_, idx) => Math.floor(2 + (Math.sin(seed + idx) + 1) * 4));
  const busFactor = Math.floor(2 + (Math.sin(seed) + 1) * 2);

  const signals: SignalItem[] = [
    { type: 'positive', icon: 'ph-star', text: `Fast growing adoption with ${stars} stars` },
    { type: 'warning', icon: 'ph-users', text: `Managed by a core group of ${busFactor} maintainers` },
    { type: 'neutral', icon: 'ph-code', text: `Primary stack is ${language}` }
  ];

  const forkTags = ['good-first-issue', language.toLowerCase(), 'documentation'];
  const forkOpportunity = `Contribute optimization patches for ${language} execution patterns or expand documentation coverage.`;
  const opportunityPitch = `This scanned project ${owner}/${name} is showing excellent momentum in the ${language} community. Early contribution or technical staging will unlock unique positioning.`;

  const issues: Issue[] = [
    { num: 12, title: 'Improve unit tests coverage', difficulty: 'easy', time: '2-4 hours', labels: ['good-first-issue', 'tests'], url: item.html_url + '/issues' },
    { num: 15, title: `Refactor core modules in ${language}`, difficulty: 'medium', time: '1-2 days', labels: ['enhancement'], url: item.html_url + '/issues' },
  ];

  const contributionGuide: ContributionStep[] = [
    { step: 1, title: 'Fork and clone', detail: `git clone your-fork && cd ${name}`, icon: 'ph-git-fork' },
    { step: 2, title: 'Install development packages', detail: 'pnpm install || npm install', icon: 'ph-package' },
    { step: 3, title: 'Read issues board', detail: 'Check the good-first-issue tag first', icon: 'ph-flag' }
  ];

  const months = ['Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];
  const commitMonths = ['Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26'];

  const starHistory = months.map((_, idx) => Math.floor((stars * 0.7) + idx * (stars * 0.05)));
  const commitHistory = commitMonths.map((_, idx) => Math.floor(10 + (Math.sin(seed + idx) + 1) * 15));

  const issuesRatio: IssuesRatio = {
    open: issues.length,
    closed: Math.floor(issues.length * 1.5),
    total: issues.length + Math.floor(issues.length * 1.5),
    rate: 60
  };

  const trendData: TrendData = {
    months,
    starHistory,
    commitMonths,
    commitHistory,
    issuesRatio
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
    }
  });

  console.log(`Inserted new scanned repository: ${owner}/${name}`);
  return {
    id,
    owner,
    name,
    description,
    language,
    stars,
    starDelta: Math.floor(stars * 0.05),
    forks,
    topics,
    category: 'ai',
    oppType: oppType ?? undefined,
    avatar,
    healthScore,
    activity,
    signals,
    busFactor,
    forkOpportunity,
    forkTags,
    opportunityPitch,
    opportunityGap: 'Requires performance tuning on asynchronous operations.',
    opportunityTargetAreas: 'Enhance file I/O operations and visual UI overlays.',
    opportunityROI: 'Expand visibility within the growing AI-agent developer sphere.',
    issues,
    contributionGuide,
    trendData
  };
}

// ========== Scan query definitions (shared between /api/scan and chunked endpoints) ==========
interface ScanQuery {
  queryString: string;
  pagesPerQuery: number;
}

const PRIMARY_QUERIES: ScanQuery[] = [
  { queryString: 'q=topic:ai-agent+stars:>50&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:llm+stars:>50&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:langchain+stars:>20&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:developer-tools+stars:>30&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:machine-learning+language:python+stars:>30&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:cli+language:rust+stars:>10&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:web+language:typescript+stars:>50&sort=updated&order=desc', pagesPerQuery: 10 },
  { queryString: 'q=topic:api+language:go+stars:>20&sort=updated&order=desc', pagesPerQuery: 10 },
];

const FALLBACK_QUERIES: ScanQuery[] = [
  { queryString: 'q=stars:>100+language:typescript&sort=stars&order=desc', pagesPerQuery: 5 },
  { queryString: 'q=stars:>100+language:python&sort=stars&order=desc', pagesPerQuery: 5 },
  { queryString: 'q=stars:>50+language:rust&sort=stars&order=desc', pagesPerQuery: 5 },
  { queryString: 'q=stars:>50+language:go&sort=stars&order=desc', pagesPerQuery: 5 },
];

function getGitHubHeaders(): Record<string, string> {
  const hasToken = Boolean(process.env.GITHUB_TOKEN);
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (hasToken) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  } else {
    console.warn('No GITHUB_TOKEN set — unauthenticated requests are heavily rate-limited (10 req/min). Set GITHUB_TOKEN for reliable scanning.');
  }
  return headers;
}

// ========== API ENDPOINTS ==========

// 1. Get Trending Repositories
app.get('/api/trending', async (req, res) => {
  const { category, search, language } = req.query;
  let query = 'SELECT * FROM repositories WHERE oppType IS NULL';
  const params: string[] = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(String(category));
  }
  if (language && language !== 'all') {
    query += ' AND LOWER(language) = ?';
    params.push(String(language).toLowerCase());
  }
  if (search) {
    query += ' AND (name LIKE ? OR owner LIKE ? OR description LIKE ?)';
    const searchParam = `%${String(search)}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY stars DESC';

  try {
    const result = await db.execute({ sql: query, args: params });
    const repos = result.rows as unknown as DbRowRaw[];
    const parsedRepos = repos.map((repo) => parseRepoRow(repo));
    res.json(parsedRepos);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// 2. Get Opportunity Repositories
app.get('/api/opportunities', async (req, res) => {
  const { oppType, category, search, language } = req.query;
  let query = 'SELECT * FROM repositories WHERE oppType IS NOT NULL';
  const params: string[] = [];

  if (oppType && oppType !== 'all') {
    query += ' AND oppType = ?';
    params.push(String(oppType));
  }
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(String(category));
  }
  if (language && language !== 'all') {
    query += ' AND LOWER(language) = ?';
    params.push(String(language).toLowerCase());
  }
  if (search) {
    query += ' AND (name LIKE ? OR owner LIKE ? OR description LIKE ?)';
    const searchParam = `%${String(search)}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY healthScore DESC, stars DESC';

  try {
    const result = await db.execute({ sql: query, args: params });
    const repos = result.rows as unknown as DbRowRaw[];
    const parsedRepos = repos.map((repo) => parseRepoRow(repo));
    res.json(parsedRepos);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
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
    const repo = result.rows[0] as unknown as DbRowRaw | undefined;
    if (!repo) {
      res.status(404).json({ error: 'Repository not found in database.' });
      return;
    }

    const parsedRepo = parseRepoRow(repo);
    res.json(parsedRepo);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// 4. Get scan queries metadata (for chunked scanning)
app.get('/api/scan/queries', (_req, res) => {
  res.json({
    primary: PRIMARY_QUERIES.map(q => ({
      queryString: q.queryString,
      pagesPerQuery: q.pagesPerQuery,
    })),
    fallback: FALLBACK_QUERIES.map(q => ({
      queryString: q.queryString,
      pagesPerQuery: q.pagesPerQuery,
    })),
    totalPrimaryChunks: PRIMARY_QUERIES.reduce((sum, q) => sum + q.pagesPerQuery, 0),
    totalFallbackChunks: FALLBACK_QUERIES.reduce((sum, q) => sum + q.pagesPerQuery, 0),
    totalChunks: [...PRIMARY_QUERIES, ...FALLBACK_QUERIES].reduce((sum, q) => sum + q.pagesPerQuery, 0),
  });
});

// 5. Chunked scan: process ONE page of ONE query (fast, safe for Vercel 10s timeout)
app.post('/api/scan/chunk', async (req, res) => {
  try {
    const { queryIndex, page, isFallback } = req.body;

    if (typeof queryIndex !== 'number' || typeof page !== 'number') {
      res.status(400).json({ error: 'queryIndex and page are required numbers' });
      return;
    }

    const queries = isFallback ? FALLBACK_QUERIES : PRIMARY_QUERIES;
    const queryDef = queries[queryIndex];

    if (!queryDef) {
      res.status(400).json({ error: `Invalid queryIndex ${queryIndex} (max ${queries.length - 1})` });
      return;
    }

    if (page < 1 || page > queryDef.pagesPerQuery) {
      res.status(400).json({ error: `Page ${page} out of range (1-${queryDef.pagesPerQuery})` });
      return;
    }

    const headers = getGitHubHeaders();
    const q = queryDef.queryString;

    console.log(`Chunk scan: ${isFallback ? 'fallback' : 'primary'} query ${queryIndex + 1}/${queries.length}, page ${page}/${queryDef.pagesPerQuery}`);

    let items: GitHubRepoItem[] = [];
    let hasMorePages = true;

    try {
      const resp = await axios.get<{ items: GitHubRepoItem[] }>(
        `https://api.github.com/search/repositories?${q}&per_page=100&page=${page}`,
        { headers, timeout: 15000 }
      );
      items = resp.data.items ?? [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Chunk query ${queryIndex} page ${page} failed: ${msg}`);
      res.json({
        repos: [],
        queryIndex,
        page,
        isFallback: Boolean(isFallback),
        hasMorePages: false,
        error: msg,
      });
      return;
    }

    if (items.length < 100) {
      hasMorePages = false;
    }

    // Process each repo item
    const updatedRepos: Repository[] = [];
    for (const item of items) {
      const repo = await processRepoItem(item);
      updatedRepos.push(repo);
    }

    res.json({
      repos: updatedRepos,
      queryIndex,
      page,
      isFallback: Boolean(isFallback),
      hasMorePages,
      totalQueries: queries.length,
      queryDescription: q.substring(0, 60),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Chunk scan error:', message);
    res.status(500).json({ error: message });
  }
});

export default app;