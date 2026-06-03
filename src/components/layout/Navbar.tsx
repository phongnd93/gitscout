import React, { useState, useRef, useCallback } from 'react';
import { useFilterStore } from '../../stores/filters';
import axios from 'axios';

interface NavbarProps {
  onScanComplete: () => void;
}

interface ScanQueriesMeta {
  primary: { queryString: string; pagesPerQuery: number }[];
  fallback: { queryString: string; pagesPerQuery: number }[];
  totalPrimaryChunks: number;
  totalFallbackChunks: number;
  totalChunks: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onScanComplete }) => {
  const { currentPage, theme, toggleTheme } = useFilterStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearScanMessage = useCallback(() => {
    setTimeout(() => setScanMessage(null), 4000);
  }, []);

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage('Preparing scan...');

    const controller = new AbortController();
    abortRef.current = controller;

    let totalReposFound = 0;
    let primaryRepoCount = 0;

    try {
      // Step 1: Get query metadata
      const metaRes = await axios.get<ScanQueriesMeta>('/api/scan/queries', {
        signal: controller.signal,
      });
      const { primary, fallback, totalPrimaryChunks } = metaRes.data;

      // Step 2: Scan primary queries chunk by chunk
      let chunkNum = 0;
      for (let qi = 0; qi < primary.length; qi++) {
        const q = primary[qi];
        for (let page = 1; page <= q.pagesPerQuery; page++) {
          if (controller.signal.aborted) break;
          chunkNum++;
          setScanMessage(
            `Scanning primary ${qi + 1}/${primary.length}, page ${page}/${q.pagesPerQuery} (chunk ${chunkNum}/${totalPrimaryChunks})`
          );

          try {
            const chunkRes = await axios.post('/api/scan/chunk', {
              queryIndex: qi,
              page,
              isFallback: false,
            }, { signal: controller.signal, timeout: 18000 });

            totalReposFound += chunkRes.data.repos?.length ?? 0;
            primaryRepoCount += chunkRes.data.repos?.length ?? 0;

            if (!chunkRes.data.hasMorePages) {
              break;
            }
          } catch (err: unknown) {
            const msg = axios.isAxiosError(err)
              ? (err.response?.data?.error || err.message)
              : err instanceof Error ? err.message : String(err);
            console.warn(`Chunk ${chunkNum} failed: ${msg}`);
            // Continue to next chunk on error
          }

          // Small delay between chunks to avoid overwhelming Vercel
          if (!controller.signal.aborted) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      // Step 3: If too few results from primary, scan fallback queries
      if (primaryRepoCount < 50 && !controller.signal.aborted) {
        setScanMessage(`Low results (${primaryRepoCount}), scanning fallback queries...`);
        const totalFallbackChunks = metaRes.data.totalFallbackChunks;
        let fallbackChunkNum = 0;

        for (let qi = 0; qi < fallback.length; qi++) {
          const q = fallback[qi];
          for (let page = 1; page <= q.pagesPerQuery; page++) {
            if (controller.signal.aborted) break;
            fallbackChunkNum++;
            setScanMessage(
              `Scanning fallback ${qi + 1}/${fallback.length}, page ${page}/${q.pagesPerQuery} (chunk ${fallbackChunkNum}/${totalFallbackChunks})`
            );

            try {
              const chunkRes = await axios.post('/api/scan/chunk', {
                queryIndex: qi,
                page,
                isFallback: true,
              }, { signal: controller.signal, timeout: 18000 });

              totalReposFound += chunkRes.data.repos?.length ?? 0;

              if (!chunkRes.data.hasMorePages) {
                break;
              }
            } catch (err: unknown) {
              console.warn(`Fallback chunk ${fallbackChunkNum} failed`);
            }

            if (!controller.signal.aborted) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        }
      }

      if (controller.signal.aborted) {
        setScanMessage('Scan cancelled.');
        clearScanMessage();
        return;
      }

      setScanMessage(`Scan complete! Found ${totalReposFound} repos.`);
      onScanComplete();
      clearScanMessage();
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        setScanMessage('Scan cancelled.');
      } else {
        const message = axios.isAxiosError(err)
          ? (err.response?.data?.error || err.message)
          : err instanceof Error ? err.message : String(err);
        console.warn('Scan failed:', message);
        setScanMessage('Scan failed. Try again shortly.');
      }
      clearScanMessage();
    } finally {
      setIsScanning(false);
      abortRef.current = null;
    }
  };

  const handleCancelScan = () => {
    if (abortRef.current) {
      abortRef.current.abort();
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
                onClick={isScanning ? handleCancelScan : handleScan}
                className={`px-3 py-1 text-xs font-mono rounded border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isScanning 
                    ? 'border-red-400/60 bg-red-400/5 text-red-400 animate-pulse'
                    : 'border-accent/30 hover:border-accent hover:bg-accent/5 text-accent'
                }`}
              >
                <i className={`ph ${isScanning ? 'ph-x-circle' : 'ph-navigation-arrow'}`}></i>
                {isScanning ? 'Cancel' : 'Scan GitHub'}
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