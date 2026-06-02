import React from 'react';
import type { Repository } from '../../types/github';

interface OpportunityCardProps {
  repo: Repository;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ repo }) => {

  const handleCardClick = () => {
    // Navigate via the standard Hash Router to open repo detail!
    window.location.hash = `#/opportunity/${repo.owner}/${repo.name}`;
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

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  return (
    <div
      onClick={handleCardClick}
      className="repo-card p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface cursor-pointer"
    >
      {/* Header */}
      <div className="flex gap-3 mb-3">
        <img
          src={repo.avatar}
          alt={`${repo.owner}/${repo.name}`}
          className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-bg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${repo.name}`;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">
              {repo.owner}/{repo.name}
            </h3>
            {getOpportunityBadge(repo.oppType)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {repo.description.substring(0, 50)}
            {repo.description.length > 50 ? '...' : ''}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
        {repo.description}
      </p>

      {/* Topics */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {repo.topics.slice(0, 4).map((topic, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs rounded-pill bg-gray-50 dark:bg-dark-bg text-zinc-600 dark:text-zinc-400 border border-gray-200 dark:border-dark-border"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* Footer Stats Row */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        <span className="flex items-center gap-1">
          <i className="ph ph-star text-yellow-500"></i>
          <span className="font-mono">{formatNumber(repo.stars)}</span>
        </span>
        <span className="flex items-center gap-1 text-green-500">
          <i className="ph ph-trend-up"></i>
          <span className="font-mono">+{formatNumber(repo.starDelta)}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${getLanguageColorClass(repo.language)}`}></span>
          <span>{repo.language}</span>
        </span>
        <span className="flex items-center gap-1">
          <i className="ph ph-git-fork"></i>
          <span className="font-mono">{formatNumber(repo.forks)}</span>
        </span>
      </div>
    </div>
  );
};
