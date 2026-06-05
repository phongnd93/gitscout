export type OpportunityType = 'rising' | 'bounty' | 'abandoned' | 'firstpr' | 'design';

export type IssueDifficulty = 'easy' | 'medium' | 'hard';

export type SignalType = 'positive' | 'warning' | 'negative' | 'neutral';

export type PageType = 'trending' | 'opportunities' | 'detail';

export type TimeRange = 'today' | 'week' | 'month';

export type Theme = 'dark' | 'light';

export interface Issue {
  num: number;
  title: string;
  difficulty: IssueDifficulty;
  time: string;
  labels: string[];
  url: string;
}

export interface ContributionStep {
  step: number;
  title: string;
  detail: string;
  icon: string;
}

export interface OpportunityBreakdown {
  emoji: string;
  title: string;
  description: string;
  difficulty: IssueDifficulty | 'varies';
  time: string;
}

export interface QuickAction {
  icon: string;
  label: string;
  url: string;
  primary?: boolean;
}

export interface SignalItem {
  type: SignalType;
  icon: string;
  text: string;
}

export interface IssuesRatio {
  open: number;
  closed: number;
  total: number;
  rate: number;
}

export interface TrendData {
  months: string[];
  starHistory: number[];
  commitMonths: string[];
  commitHistory: number[];
  issuesRatio: IssuesRatio;
}

export interface Repository {
  id: number;
  owner: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  starDelta: number;
  forks: number;
  topics: string[];
  category: string;
  oppType?: OpportunityType;
  avatar: string;
  healthScore?: number;
  activity?: number[];
  signals?: SignalItem[];
  busFactor?: number;
  forkOpportunity?: string;
  forkTags?: string[];
  opportunityPitch?: string;
  opportunityGap?: string;
  opportunityTargetAreas?: string;
  opportunityROI?: string;
  issues?: Issue[];
  contributionGuide?: ContributionStep[];
  trendData?: TrendData;
  created_at?: string;
}

/** Raw row shape from SQLite/turso before JSON.parse — all values are primitive. */
export interface DbRowRaw {
  id: number;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number | null;
  starDelta: number | null;
  forks: number | null;
  topics: string | null;
  category: string | null;
  oppType: string | null;
  avatar: string | null;
  healthScore: number | null;
  activity: string | null;
  signals: string | null;
  busFactor: number | null;
  forkOpportunity: string | null;
  forkTags: string | null;
  opportunityPitch: string | null;
  opportunityGap: string | null;
  opportunityTargetAreas: string | null;
  opportunityROI: string | null;
  issues: string | null;
  contributionGuide: string | null;
  trendData: string | null;
  created_at: string | null;
}

/** Shape for libsql batch statements. */
export interface DbStatement {
  sql: string;
  args: Record<string, unknown>;
}

/** Query parameters for API filtering. */
export interface QueryParams {
  category?: string;
  oppType?: string;
  language?: string;
  search?: string;
}

/** Generic error with optional Axios shape. */
export interface AxiosErrorShape {
  message: string;
  response?: {
    status: number;
    data: unknown;
  };
}

/** GitHub API auth headers. */
export interface GitHubHeaders {
  Authorization?: string;
}

/** Spotlight style object for opportunity badges. */
export interface SpotlightStyle {
  border: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  label: string;
  iconClass: string;
}