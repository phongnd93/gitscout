export type OpportunityType = 'rising' | 'bounty' | 'abandoned' | 'firstpr' | 'design';

export interface Issue {
  num: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
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
  difficulty: 'easy' | 'medium' | 'hard';
  time: string;
}

export interface QuickAction {
  icon: string;
  label: string;
  url: string;
  primary?: boolean;
}

export interface SignalItem {
  type: 'positive' | 'warning' | 'negative' | 'neutral';
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
}
