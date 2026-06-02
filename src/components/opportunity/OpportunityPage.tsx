import React, { useEffect, useState } from 'react';
import { useFilterStore } from '../../stores/filters';
import { OpportunityCard } from './OpportunityCard';
import type { Repository } from '../../types/github';
import axios from 'axios';
import { CategoryTrendChart } from '../ui/CategoryTrendChart';

interface OpportunityPageProps {
  scanToken: number;
}

export const OpportunityPage: React.FC<OpportunityPageProps> = ({ scanToken }) => {
  const { 
    currentOppType, 
    setCurrentOppType,
    currentCategory, 
    searchQuery, 
    selectedLanguage 
  } = useFilterStore();
  
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = {};
        if (currentOppType !== 'all') params.oppType = currentOppType;
        if (currentCategory !== 'all') params.category = currentCategory;
        if (selectedLanguage !== 'all') params.language = selectedLanguage;
        if (searchQuery) params.search = searchQuery;

        const res = await axios.get('/api/opportunities', { params });
        setRepos(res.data as Repository[]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Failed to fetch opportunities:', message);
        setError('Failed to sync opportunity scouter databases.');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [currentOppType, currentCategory, searchQuery, selectedLanguage, scanToken]);

  const oppTypes = [
    { 
      id: 'all', 
      label: 'All Types', 
      desc: 'View all opportunity categories',
      icon: 'ph-stack text-accent' 
    },
    { 
      id: 'rising', 
      label: 'Rising Stars', 
      desc: 'Fast-growing repos needing early contributors',
      icon: 'ph-trend-up text-green-500' 
    },
    { 
      id: 'bounty', 
      label: 'Issue Bounty', 
      desc: 'Issues tagged with bounties or rewards',
      icon: 'ph-currency-circle-dollar text-accent' 
    },
    { 
      id: 'abandoned', 
      label: 'Abandoned Gold', 
      desc: 'High-star repos with inactive maintainers',
      icon: 'ph-archive text-amber-500' 
    },
    { 
      id: 'firstpr', 
      label: 'First PR Friendly', 
      desc: 'Issues labeled for first-time contributors',
      icon: 'ph-hand-waving text-green-500' 
    },
    { 
      id: 'design', 
      label: 'Design Polish', 
      desc: 'Frontend, UI/UX styling and layout polish',
      icon: 'ph-paint-brush-broad text-purple-500' 
    }
  ];

  return (
    <div id="page-opportunity">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight leading-none text-gray-900 dark:text-dark-text mb-2">
          Opportunity Scout
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hunt for high-potential repositories. Filter by opportunity profile below.
        </p>
      </div>

      {/* Opportunity Type Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {oppTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setCurrentOppType(type.id)}
            className={`opp-type-card p-3 rounded-card border text-left cursor-pointer transition-all duration-200 ${
              currentOppType === type.id
                ? 'border-accent bg-accent/5 dark:bg-accent/10 selected'
                : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface'
            }`}
          >
            <i className={`ph ${type.icon} text-lg mb-2 block`}></i>
            <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-1">
              {type.label}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight">
              {type.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Category Trend Line Chart */}
      {!loading && !error && <CategoryTrendChart repos={repos} />}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="repo-card p-4 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
            >
              <div className="flex gap-3 mb-3">
                <div className="skeleton w-10 h-10 rounded-lg"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-3 w-48"></div>
                </div>
              </div>
              <div className="skeleton h-3 w-full mb-2"></div>
              <div className="skeleton h-3 w-3/4 mb-3"></div>
              <div className="flex gap-2 mb-3">
                <div className="skeleton h-5 w-16 rounded-pill"></div>
                <div className="skeleton h-5 w-20 rounded-pill"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="skeleton h-3 w-16"></div>
                <div className="skeleton h-3 w-12"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Alert Box */}
      {error && !loading && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-500 rounded-card text-xs font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && repos.length === 0 && (
        <div className="py-16 text-center">
          <i className="ph ph-folder-open text-4xl text-zinc-600 mb-4 block"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-1">
            No opportunities found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Try selecting a different opportunity type.
          </p>
        </div>
      )}

      {/* Opportunities Grid */}
      {!loading && !error && repos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {repos.map((repo) => (
            <OpportunityCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

    </div>
  );
};
