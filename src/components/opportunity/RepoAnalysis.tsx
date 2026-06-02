import React, { useEffect, useState } from 'react';
import { useFilterStore } from '../../stores/filters';
import type { Repository, SpotlightStyle } from '../../types/github';
import axios from 'axios';

export const RepoAnalysis: React.FC = () => {
  const { selectedRepo, setSelectedRepo, currentPage } = useFilterStore();
  const [repo, setRepo] = useState<Repository | null>(selectedRepo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let targetOwner = '';
    let targetName = '';

    if (selectedRepo) {
      targetOwner = selectedRepo.owner;
      targetName = selectedRepo.name;
    } else {
      // Look up repository from URL hash if not in memory (perfect for reloads!)
      const hash = window.location.hash;
      const parts = hash.split('/');
      targetOwner = parts[2] || '';
      targetName = parts[3] || '';
    }

    if (!targetOwner || !targetName) return;

    // Smart Guard Check: Prevent loop rendering and redundant fetches
    // if the local state 'repo' already holds the detailed data for this repository
    if (
      repo &&
      repo.owner.toLowerCase() === targetOwner.toLowerCase() &&
      repo.name.toLowerCase() === targetName.toLowerCase() &&
      repo.issues
    ) {
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/opportunities/${targetOwner}/${targetName}`);
        setRepo(res.data);
        setSelectedRepo(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Failed to fetch repo detail:', message);
        setError('Repository details not found in cache.');
        if (selectedRepo) {
          setRepo(selectedRepo);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [selectedRepo?.owner, selectedRepo?.name]);

  const handleBack = () => {
    if (currentPage === 'trending') {
      window.location.hash = '#/trending';
    } else {
      window.location.hash = '#/opportunity';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <i className="ph ph-arrow-left"></i>
          <span>Back to opportunities</span>
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton w-11 h-11 rounded-lg"></div>
          <div className="space-y-2 flex-1">
            <div className="skeleton h-5 w-40"></div>
            <div className="skeleton h-3.5 w-80"></div>
          </div>
        </div>
        <div className="skeleton h-[350px] w-full rounded-card mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton h-20 rounded-card"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center border border-red-500/20 bg-red-500/5 text-red-500 rounded-card space-y-4 font-mono text-xs">
        <i className="ph ph-warning-circle text-3xl"></i>
        <h3 className="text-sm font-semibold">Failed to Scout Repository Gaps</h3>
        <p>{error}</p>
        <button
          onClick={handleBack}
          className="px-3 py-1.5 text-xs font-mono border border-red-500 text-red-500 rounded hover:bg-red-500/5 transition-all cursor-pointer"
        >
          &larr; Back to Opportunities
        </button>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="p-10 text-center border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-card space-y-4">
        <i className="ph ph-warning text-3xl text-zinc-500"></i>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">No Repository Selected</h3>
        <button
          onClick={handleBack}
          className="px-3 py-1.5 text-xs font-mono border border-accent text-accent rounded hover:bg-accent/5 transition-all cursor-pointer"
        >
          &larr; Back to Opportunities
        </button>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  const getLanguageColorClass = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python': return 'bg-blue-400';
      case 'javascript': return 'bg-yellow-400';
      case 'typescript': return 'bg-blue-500';
      case 'rust': return 'bg-orange-500';
      case 'go': return 'bg-cyan-400';
      case 'java': return 'bg-red-400';
      case 'cpp': return 'bg-purple-400';
      case 'swift': return 'bg-orange-400';
      case 'dart': return 'bg-blue-400';
      case 'yaml': return 'bg-pink-400';
      case 'css': return 'bg-purple-500';
      case 'html': return 'bg-orange-500';
      case 'markdown': return 'bg-emerald-500';
      default: return 'bg-zinc-400';
    }
  };

  const getOpportunityBadge = (type?: string) => {
    switch (type) {
      case 'rising':
        return <span className="badge diff-easy">Rising</span>;
      case 'bounty':
        return <span className="badge bg-accent/20 text-accent dark:text-accent border border-accent/10">Bounty</span>;
      case 'abandoned':
        return <span className="badge diff-hard">Abandoned</span>;
      case 'firstpr':
        return <span className="badge diff-easy">Good First Issue</span>;
      case 'design':
        return <span className="badge diff-medium">Design Polish</span>;
      default:
        return null;
    }
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent health';
    if (score >= 60) return 'Good health';
    if (score >= 40) return 'Needs attention';
    return 'At risk';
  };

  const getBusColorClass = (factor?: number) => {
    if (factor === undefined) return 'text-zinc-500';
    if (factor <= 1) return 'text-red-500';
    if (factor <= 3) return 'text-amber-500';
    return 'text-green-500';
  };

  const getBusLabel = (factor?: number) => {
    if (factor === undefined) return 'N/A';
    if (factor <= 1) return 'Critical risk';
    if (factor <= 3) return 'Moderate risk';
    return 'Healthy';
  };

  const getSignalColorClass = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'negative': return 'text-red-500';
      default: return 'text-zinc-500 dark:text-zinc-400';
    }
  };

  const getSpotlightStyles = (type?: string): SpotlightStyle => {
    const defaultStyle: SpotlightStyle = {
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      label: 'Rising Star Spotlight',
      iconClass: 'ph-trend-up'
    };

    switch (type) {
      case 'rising': return defaultStyle;
      case 'bounty': return {
        border: 'border-indigo-500/30',
        bg: 'bg-indigo-500/5',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-500',
        label: 'Issue Bounty Spotlight',
        iconClass: 'ph-currency-circle-dollar'
      };
      case 'abandoned': return {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-500',
        label: 'Abandoned Gold Spotlight',
        iconClass: 'ph-archive'
      };
      case 'firstpr': return {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/5',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-500',
        label: 'First PR Friendly Spotlight',
        iconClass: 'ph-hand-waving'
      };
      case 'design': return {
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/5',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-500',
        label: 'Design Polish Spotlight',
        iconClass: 'ph-paint-brush-broad'
      };
      default: return defaultStyle;
    }
  };

  const spotlight = getSpotlightStyles(repo.oppType);

  const getOpportunityBreakdowns = (type?: string) => {
    const opps = [];
    if (type === 'rising') {
      opps.push(
        { emoji: '🚀', title: 'Early Contributor Advantage', description: 'Shape the architecture before it gets locked in. Early contributors become core maintainers.', difficulty: 'medium', time: 'Long-term ROI' },
        { emoji: '📈', title: 'Growing Community', description: `${formatNumber(repo.stars)} stars with steady growth. Your contributions get maximum visibility.`, difficulty: 'easy', time: 'Visibility boost' },
        { emoji: '🔧', title: 'Open Architecture Decisions', description: 'Key design decisions are still being made. Your input on RFCs has real weight.', difficulty: 'hard', time: 'High impact' }
      );
    } else if (type === 'bounty') {
      const bountyIssues = (repo.issues || []).filter(i => i.labels.includes('bounty'));
      const totalBounty = bountyIssues.reduce((sum, i) => {
        const match = i.time.match(/\$(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
      opps.push(
        { emoji: '💰', title: `${totalBounty > 0 ? '$' + totalBounty + ' in' : 'Active'} Bounties`, description: bountyIssues.length > 0 ? `Issues: ${bountyIssues.map(i => '#' + i.num).join(', ')}. Claim before starting work.` : 'Active bounty program with rewards.', difficulty: 'medium', time: `${bountyIssues.length} bounties` },
        { emoji: '🧪', title: 'Skill Building', description: `Real-world ${repo.language} codebase. Learn from battle-tested patterns.`, difficulty: 'easy', time: 'Learning value' },
        { emoji: '🌐', title: 'Enterprise Exposure', description: 'Contributions to infrastructure repos get seen by companies using them.', difficulty: 'medium', time: 'Career ROI' }
      );
    } else if (type === 'abandoned') {
      opps.push(
        { emoji: '👑', title: 'Become the Maintainer', description: `With ${formatNumber(repo.stars)} stars and zero active maintainers, a fork by YOU becomes the de facto version.`, difficulty: 'hard', time: 'Community leadership' },
        { emoji: '🐛', title: 'Fix Critical Issues', description: 'Security patches and bugs pile up when nobody is minding the store. Quick wins available.', difficulty: 'medium', time: '1-2 days each' },
        { emoji: '📦', title: 'Merge Unmerged PRs', description: 'Dozens of community PRs with improvements sit unreviewed. Cherry-pick the best.', difficulty: 'easy', time: 'Quick wins' }
      );
    } else if (type === 'firstpr') {
      const fpCount = (repo.issues || []).filter(i => i.labels.some(l => l.includes('good-first') || l.includes('first-timer'))).length;
      opps.push(
        { emoji: '👋', title: 'Beginner-Friendly Issues', description: `${fpCount} issues explicitly labeled for newcomers. Clear scope, guided by maintainers.`, difficulty: 'easy', time: '2-4 hours each' },
        { emoji: '🤝', title: 'Active Mentorship', description: 'Responsive maintainers who review PRs quickly and provide constructive feedback.', difficulty: 'easy', time: 'Support available' },
        { emoji: '📝', title: 'Documentation Wins', description: 'Doc improvements are always welcome and get merged fastest. Low risk, high visibility.', difficulty: 'easy', time: '1-3 hours' }
      );
    } else if (type === 'design') {
      opps.push(
        { emoji: '🎨', title: 'UI/UX Enhancement', description: 'Refactor components, add responsive overrides, and configure complex grid structures (Tailwind v4).', difficulty: 'medium', time: 'Creative scope' },
        { emoji: '✨', title: 'Aesthetic Polish', description: 'Make components look modern: configure glowing radial hover effects and glassmorphic refractions.', difficulty: 'easy', time: '1-3 hours each' },
        { emoji: '📱', title: 'Fluid Interactivity', description: 'Implement layout transitions and micro-interactions (e.g. Motion, CSS clips) to deliver smooth visuals.', difficulty: 'medium', time: 'Interactive depth' }
      );
    } else {
      opps.push(
        { emoji: '🔍', title: 'Open Issues', description: `${(repo.issues || []).length} actionable issues waiting for contributors.`, difficulty: 'varies', time: 'Varies' },
        { emoji: '📊', title: 'Project Health', description: `Health score: ${repo.healthScore}/100. Active project with room for improvement.`, difficulty: 'medium', time: 'Assessment' },
        { emoji: '🏗️', title: 'Contribute', description: repo.forkOpportunity || 'Multiple contribution paths available.', difficulty: 'medium', time: 'Get started' }
      );
    }
    return opps;
  };

  const breakdowns = getOpportunityBreakdowns(repo.oppType);

  const getQuickActions = () => {
    const actions = [];
    const ghUrl = `https://github.com/${repo.owner}/${repo.name}`;
    actions.push({ icon: 'ph-git-fork', label: 'Fork Repository', url: ghUrl + '/fork', primary: true });
    
    const firstIssue = (repo.issues || []).find(i => i.labels.some(l => l.includes('good-first') || l.includes('first-timer') || l.includes('bounty')));
    if (firstIssue) {
      actions.push({ icon: 'ph-flag', label: `Start with #${firstIssue.num}`, url: ghUrl + `/issues/${firstIssue.num}`, primary: false });
    }
    actions.push({ icon: 'ph-book-open', label: 'Read CONTRIBUTING', url: ghUrl + '/blob/main/CONTRIBUTING.md', primary: false });
    actions.push({ icon: 'ph-git-pull-request', label: 'Open Issues', url: ghUrl + '/issues', primary: false });
    return actions;
  };

  const actions = getQuickActions();


  return (
    <div id="page-opp-detail">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="back-btn flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-dark-text mb-6 cursor-pointer"
      >
        <i className="ph ph-arrow-left"></i>
        <span>Back to opportunities</span>
      </button>

      {/* Repo Identity Bar */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src={repo.avatar}
          alt={`${repo.owner}/${repo.name}`}
          className="w-11 h-11 rounded-lg bg-gray-50 dark:bg-dark-bg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${repo.name}`;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-dark-text">
              {repo.owner}/{repo.name}
            </h1>
            {getOpportunityBadge(repo.oppType)}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span className="flex items-center gap-1">
              <i className="ph ph-star text-yellow-500"></i>
              {formatNumber(repo.stars)}
            </span>
            <span className="flex items-center gap-1">
              <i className="ph ph-git-fork"></i>
              {formatNumber(repo.forks)}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${getLanguageColorClass(repo.language)}`}></span>
              {repo.language}
            </span>
            <span>
              {repo.description.substring(0, 80)}
              {repo.description.length > 80 ? '...' : ''}
            </span>
          </div>
        </div>
        <a
          href={`https://github.com/${repo.owner}/${repo.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-small bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-accent transition-colors"
        >
          <i className="ph ph-github-logo"></i>
          View on GitHub
        </a>
      </div>

      {/* OPPORTUNITY SPOTLIGHT BOX */}
      <div className={`rounded-card p-6 md:p-8 mb-6 border ${spotlight.border} ${spotlight.bg} transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg ${spotlight.iconBg} flex items-center justify-center animate-pulse`}>
            <i className={`ph ${spotlight.iconClass} text-base ${spotlight.iconColor}`}></i>
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${spotlight.iconColor}`}>
            {spotlight.label}
          </span>
        </div>

        <h2 className="text-lg md:text-xl font-medium text-gray-900 dark:text-dark-text leading-relaxed mb-6">
          {repo.opportunityPitch || repo.forkOpportunity}
        </h2>

        {/* Asymmetric Sub-panel Grid for Gap & ROI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* SaaS Gaps */}
          <div className="p-4 rounded-card border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <div className="flex items-center gap-2 mb-2 text-red-500 dark:text-red-400">
              <i className="ph ph-warning-circle text-base"></i>
              <h4 className="text-xs font-semibold uppercase tracking-wider">SaaS Pain Points & Flaws</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
              {repo.opportunityGap || 'The core codebase is currently extremely difficult to host and lacks key customer-facing features like integrated Auth, Stripe billing flows, or collaboration dashboards. Users are actively begging for a managed cloud instance.'}
            </p>
            <div className="border-t border-gray-100 dark:border-dark-border/40 pt-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                Unmet Customer Demand / Feature Gaps
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
                {repo.opportunityTargetAreas || 'Launch a hosted cloud-managed solution, simplify docker scripting, or wrap the terminal CLI tool in a gorgeous web GUI dashboard.'}
              </p>
            </div>
          </div>

          {/* ROI Panel */}
          <div className="p-4 rounded-card border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <div className="flex items-center gap-2 mb-2 text-green-500 dark:text-green-400">
              <i className="ph ph-chart-line-up text-base"></i>
              <h4 className="text-xs font-semibold uppercase tracking-wider">SaaS Monetization Strategy & ROI</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {repo.opportunityROI || 'Build a steady stream of monthly recurring revenue (MRR). By resolving hosting friction, you can capture an active audience of technical users willing to pay for convenience.'}
            </p>
          </div>
        </div>

        {/* Opportunity Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {breakdowns.map((opp, idx) => (
            <div
              key={idx}
              className="p-4 rounded-card border border-gray-200/60 dark:border-dark-border/60 bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{opp.emoji}</span>
                <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text">{opp.title}</h4>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                {opp.description}
              </p>
              <div className="flex items-center gap-2">
                <span className={`badge diff-${opp.difficulty}`}>{opp.difficulty}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{opp.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        {actions.map((act, idx) => (
          <a
            key={idx}
            href={act.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-small transition-colors ${
              act.primary
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-accent'
            }`}
          >
            <i className={`ph ${act.icon}`}></i>
            {act.label}
          </a>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Stars</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-semibold text-gray-900 dark:text-dark-text">
              {formatNumber(repo.stars)}
            </span>
            <span className="text-sm text-green-500 font-mono">+{formatNumber(repo.starDelta)}</span>
          </div>
        </div>
        <div className="p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Health Score</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-semibold text-accent">
              {repo.healthScore ?? '--'}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">/100</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {repo.healthScore ? getHealthLabel(repo.healthScore) : 'N/A'}
          </p>
        </div>
        <div className="p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Bus Factor</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-semibold ${getBusColorClass(repo.busFactor)}`}>
              {repo.busFactor ?? '--'}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 pl-1">maintainers</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {getBusLabel(repo.busFactor)}
          </p>
        </div>
        <div className="p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Forks</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-semibold text-gray-900 dark:text-dark-text">
              {formatNumber(repo.forks)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">community forks</p>
        </div>
      </div>


      {/* Signals Breakdown */}
      {repo.signals && repo.signals.length > 0 && (
        <div id="detail-signals-section" className="mb-8 animate-fade-in">
          <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            <i className="ph ph-chart-line-up text-accent"></i>
            Signals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {repo.signals.map((sig, idx) => (
              <div
                key={idx}
                className="p-3 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
              >
                <div className="flex items-center gap-3">
                  <i className={`ph ${sig.icon} text-base ${getSignalColorClass(sig.type)}`}></i>
                  <span className="text-sm text-gray-900 dark:text-dark-text">{sig.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Actionable Issues */}
      {repo.issues && repo.issues.length > 0 && (
        <div id="detail-issues-section" className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            <i className="ph ph-git-pull-request text-accent"></i>
            Open Issues You Can Work On
          </h3>
          <div className="space-y-3">
            {repo.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`issue-card p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface ${
                  issue.labels.includes('urgent') || issue.labels.includes('critical')
                    ? 'pulse-urgent'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">#{issue.num}</span>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text">
                        {issue.title}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {issue.labels.map((lbl, lIdx) => (
                        <span
                          key={lIdx}
                          className="px-2 py-0.5 text-xs rounded-pill bg-gray-100 dark:bg-dark-bg text-zinc-600 dark:text-zinc-400 border border-gray-200 dark:border-dark-border"
                        >
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`badge diff-${issue.difficulty}`}>{issue.difficulty}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{issue.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribution Guide */}
      {repo.contributionGuide && repo.contributionGuide.length > 0 && (
        <div id="detail-guide-section" className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            <i className="ph ph-path text-accent"></i>
            How to Start Contributing
          </h3>
          <div className="space-y-0">
            {repo.contributionGuide.map((step) => (
              <div key={step.step} className="step-connector flex gap-4 pb-6">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <i className={`ph ${step.icon} text-base text-accent`}></i>
                </div>
                
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-1">
                    Step {step.step}: {step.title}
                  </h4>
                  <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-gray-50 dark:bg-dark-bg px-3 py-2 rounded-small border border-gray-200 dark:border-dark-border">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics */}
      <div id="detail-topics-section" className="mb-6">
        <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Topics</h3>
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs rounded-pill bg-gray-50 dark:bg-dark-bg text-zinc-600 dark:text-zinc-400 border border-gray-200 dark:border-dark-border"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
