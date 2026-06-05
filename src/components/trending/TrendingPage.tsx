import React, { useEffect, useState } from 'react';
import { useFilterStore } from '../../stores/filters';
import { TrendingCard } from './TrendingCard';
import type { Repository } from '../../types/github';
import axios from 'axios';
import { CategoryTrendChart } from '../ui/CategoryTrendChart';

interface TrendingPageProps {
  scanToken: number;
}

export const TrendingPage: React.FC<TrendingPageProps> = ({ scanToken }) => {
  const { 
    currentCategory, 
    setCurrentCategory,
    searchQuery, 
    setSearchQuery,
    selectedLanguage, 
    setSelectedLanguage,
    currentTimeRange,
    setCurrentTimeRange
  } = useFilterStore();
  
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = {};
        if (currentCategory !== 'all') params.category = currentCategory;
        if (selectedLanguage !== 'all') params.language = selectedLanguage;
        if (searchQuery) params.search = searchQuery;
        if (currentTimeRange && currentTimeRange !== 'all') params.timeRange = currentTimeRange;

        const res = await axios.get('/api/trending', { params });
        setRepos(res.data as Repository[]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Failed to fetch trending:', message);
        setError('Failed to sync repository intelligence feed.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [currentCategory, searchQuery, selectedLanguage, currentTimeRange, scanToken]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI/ML' },
    { id: 'devtools', label: 'DevTools' },
    { id: 'web', label: 'Web' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'data', label: 'Data' },
    { id: 'infra', label: 'Infra' }
  ];

  return (
    <div id="page-trending">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight leading-none text-gray-900 dark:text-dark-text mb-2">
          Trending Repositories
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Scout top repositories and hunt for high-growth open-source opportunities.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCurrentCategory(cat.id)}
              className={`category-pill px-3 py-1.5 text-xs font-medium rounded-pill border transition-all duration-200 cursor-pointer bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text border-gray-200 dark:border-dark-border ${
                currentCategory === cat.id ? 'active bg-accent text-white border-accent' : ''
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap gap-3">
          {/* Language Dropdown */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-small bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border cursor-pointer focus:outline-none"
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          {/* Time Range Button Group */}
          <div className="flex items-center gap-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-small p-0.5">
            <button
              onClick={() => setCurrentTimeRange('today')}
              className={`time-btn px-3 py-1 text-xs font-medium rounded-pill cursor-pointer transition-all ${
                currentTimeRange === 'today'
                  ? 'bg-accent text-white'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentTimeRange('week')}
              className={`time-btn px-3 py-1 text-xs font-medium rounded-pill cursor-pointer transition-all ${
                currentTimeRange === 'week'
                  ? 'bg-accent text-white'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setCurrentTimeRange('month')}
              className={`time-btn px-3 py-1 text-xs font-medium rounded-pill cursor-pointer transition-all ${
                currentTimeRange === 'month'
                  ? 'bg-accent text-white'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-small bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>
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
                <div className="skeleton h-5 w-14 rounded-pill"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="skeleton h-3 w-16"></div>
                <div className="skeleton h-3 w-12"></div>
                <div className="skeleton h-3 w-20"></div>
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
          <i className="ph ph-magnifying-glass text-4xl text-zinc-600 mb-4 block"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-1">
            No repositories found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Repos Grid */}
      {!loading && !error && repos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {repos.map((repo) => (
            <TrendingCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

    </div>
  );
};
