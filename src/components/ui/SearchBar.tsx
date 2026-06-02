import React from 'react';
import { useFilterStore } from '../../stores/filters';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useFilterStore();

  return (
    <div className="relative w-full max-w-lg">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
        <i className="ph ph-magnifying-glass text-sm"></i>
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Scout by owner, repository name, or keyword..."
        className="w-full pl-9 pr-4 py-2 text-xs font-sans rounded-md border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-zinc-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all shadow-sm"
      />
    </div>
  );
};
