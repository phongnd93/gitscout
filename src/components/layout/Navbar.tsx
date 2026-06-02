import React, { useState } from 'react';
import { useFilterStore } from '../../stores/filters';
import axios from 'axios';

interface NavbarProps {
  onScanComplete: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScanComplete }) => {
  const { currentPage, theme, toggleTheme } = useFilterStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage('Scouting GitHub...');
    try {
      const res = await axios.post('/api/scan');
      setScanMessage(`Found ${res.data.scannedCount} opportunities!`);
      onScanComplete();
      setTimeout(() => setScanMessage(null), 3000);
    } catch (err: any) {
      setScanMessage('Failed to connect to scanner.');
      setTimeout(() => setScanMessage(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  const switchPage = (page: 'trending' | 'opportunity') => {
    window.location.hash = `#/${page}`;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/95 bg-light-bg/95 backdrop-blur-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo */}
          <div 
            onClick={() => switchPage('trending')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <i className="ph ph-binoculars text-xl text-accent"></i>
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-dark-text">
              GitScout
            </span>
          </div>

          {/* Center Nav Tabs (displayed unless viewing detailed analytics) */}
          <div 
            id="nav-tabs" 
            className={`flex items-center gap-1 relative ${currentPage === 'detail' ? 'hidden' : ''}`}
          >
            <button
              onClick={() => switchPage('trending')}
              className={`px-4 py-2 text-sm font-medium relative cursor-pointer ${
                currentPage === 'trending'
                  ? 'text-gray-900 dark:text-dark-text font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Trending
              <div 
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-accent tab-underline ${
                  currentPage === 'trending' ? '' : 'hidden'
                }`}
              ></div>
            </button>
            <button
              onClick={() => switchPage('opportunity')}
              className={`px-4 py-2 text-sm font-medium relative cursor-pointer ${
                currentPage === 'opportunities'
                  ? 'text-gray-900 dark:text-dark-text font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Opportunity
              <div 
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-accent tab-underline ${
                  currentPage === 'opportunities' ? '' : 'hidden'
                }`}
              ></div>
            </button>
          </div>

          {/* Theme Toggle & Scan Group */}
          <div className="flex items-center gap-3">
            
            {/* Active Scanner Status */}
            <div className="relative flex items-center">
              {scanMessage && (
                <span className="absolute -left-44 mr-2 bg-dark-surface/90 text-[10px] text-accent font-mono border border-dark-border px-2 py-1 rounded shadow-lg backdrop-blur animate-fade-in-right">
                  {scanMessage}
                </span>
              )}
              
              <button
                onClick={handleScan}
                disabled={isScanning}
                className={`px-3 py-1 text-xs font-mono rounded border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isScanning 
                    ? 'border-accent/45 bg-accent/5 text-accent animate-pulse'
                    : 'border-accent/30 hover:border-accent hover:bg-accent/5 text-accent'
                }`}
              >
                <i className={`ph ${isScanning ? 'ph-radar animate-spin' : 'ph-navigation-arrow'}`}></i>
                {isScanning ? 'Scouting...' : 'Scan GitHub'}
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle p-2 rounded-small hover:bg-white dark:bg-dark-surface hover:bg-light-surface text-gray-900 dark:text-dark-text cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <i className="ph ph-sun text-lg"></i>
              ) : (
                <i className="ph ph-moon text-lg"></i>
              )}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
