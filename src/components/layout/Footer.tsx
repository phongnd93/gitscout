import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface/30 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
        
        {/* Left Side */}
        <div className="flex items-center gap-2">
          <i className="ph ph-binoculars text-accent"></i>
          <span>GitScout Opportunity Scout — Staged Cache Mode</span>
        </div>

        {/* Middle Status Indicators */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Local VPS Scaffolding SQLite Cache Active
          </span>
        </div>

        {/* Right Side */}
        <div>
          <span>&copy; {new Date().getFullYear()} DeepMind Pair Programming. Built with Tailwind v4.</span>
        </div>

      </div>
    </footer>
  );
};
