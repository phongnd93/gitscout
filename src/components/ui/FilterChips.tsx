import React from 'react';
import { useFilterStore } from '../../stores/filters';

export const FilterChips: React.FC = () => {
  const {
    currentCategory,
    setCurrentCategory,
    selectedLanguage,
    setSelectedLanguage,
    currentOppType,
    setCurrentOppType,
    currentPage
  } = useFilterStore();

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'ai', label: 'AI & Agents' },
    { id: 'web', label: 'Web Dev' },
    { id: 'data', label: 'Data Systems' },
    { id: 'infra', label: 'Infrastructure' },
    { id: 'devtools', label: 'Dev Tools' },
    { id: 'mobile', label: 'Mobile' }
  ];

  const languages = [
    { id: 'all', label: 'All Languages' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'rust', label: 'Rust' },
    { id: 'python', label: 'Python' },
    { id: 'go', label: 'Go' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'cpp', label: 'C++' },
    { id: 'markdown', label: 'Markdown' }
  ];

  const oppTypes = [
    { id: 'all', label: 'All Opportunities' },
    { id: 'rising', label: '🔥 Rising Stars', desc: 'Exponential star velocity' },
    { id: 'bounty', label: '🐛 Issue Bounties', desc: 'Paid open issue tickets' },
    { id: 'abandoned', label: '💤 Abandoned Gold', desc: 'Stalled popular assets' },
    { id: 'firstpr', label: '🌱 Good First PR', desc: 'Welcoming maintainers' },
    { id: 'design', label: '🎨 Design Upgrades', desc: 'Premium UI value gaps' }
  ];

  return (
    <div className="space-y-4">
      {/* Category Selection Row */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 dark:border-dark-border/40 pb-3">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mr-2">Category:</span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCurrentCategory(cat.id)}
            className={`px-2.5 py-1 text-xs rounded transition-all duration-200 cursor-pointer ${
              currentCategory === cat.id
                ? 'bg-accent/15 border border-accent/30 text-accent font-semibold'
                : 'border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-zinc-500 hover:text-gray-900 dark:hover:text-dark-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Language Selector Row */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 dark:border-dark-border/40 pb-3">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mr-2">Language:</span>
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setSelectedLanguage(lang.id)}
            className={`px-2.5 py-1 text-xs rounded transition-all duration-200 cursor-pointer ${
              selectedLanguage === lang.id
                ? 'bg-accent/15 border border-accent/30 text-accent font-semibold'
                : 'border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-zinc-500 hover:text-gray-900 dark:hover:text-dark-text'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Opportunity Type Bento Filters (Only displayed on Opportunity tab) */}
      {currentPage === 'opportunities' && (
        <div className="pt-2">
          <span className="block text-[10px] text-zinc-500 font-mono tracking-wider uppercase mb-3">Scouting Vectors:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {oppTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => setCurrentOppType(type.id)}
                className={`p-3 border rounded-card cursor-pointer transition-all duration-200 text-left hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between h-20 ${
                  currentOppType === type.id
                    ? 'border-accent bg-accent/8 dark:bg-accent/10 shadow-sm shadow-accent/5'
                    : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-semibold text-gray-900 dark:text-dark-text leading-tight block">
                  {type.label}
                </span>
                {type.desc && (
                  <span className="text-[9px] text-zinc-500 font-mono tracking-tight block">
                    {type.desc}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
