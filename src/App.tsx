import React, { useEffect, useState } from 'react';
import { useFilterStore } from './stores/filters';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { TrendingPage } from './components/trending/TrendingPage';
import { OpportunityPage } from './components/opportunity/OpportunityPage';
import { RepoAnalysis } from './components/opportunity/RepoAnalysis';
import axios from 'axios';

const App: React.FC = () => {
  const { currentPage, setCurrentPage, setSelectedRepo, initTheme } = useFilterStore();
  const [scanToken, setScanToken] = useState(0);

  useEffect(() => {
    // Initialize dark/light design system preferences
    initTheme();

    // HASH ROUTER ENGINE (exactly mirrors index.html.backup routing flow)
    const handleRouting = async () => {
      const hash = window.location.hash || '#/trending';
      
      if (hash.startsWith('#/opportunity/')) {
        const parts = hash.split('/');
        const owner = parts[2];
        const name = parts[3];
        
        if (owner && name) {
          try {
            // Fetch direct repo cache details from local SQLite
            const res = await axios.get(`/api/opportunities/${owner}/${name}`);
            setSelectedRepo(res.data);
            setCurrentPage('detail');
          } catch (err) {
            console.warn('Repository detail not found in SQLite caches. Redirecting to opportunities list.');
            setSelectedRepo(null);
            window.location.hash = '#/opportunity';
          }
        }
      } else if (hash === '#/opportunity') {
        setSelectedRepo(null);
        setCurrentPage('opportunities');
      } else {
        setSelectedRepo(null);
        setCurrentPage('trending');
      }
    };

    // Run routing check on mount
    handleRouting();

    // Bind event listeners for hash routing changes
    window.addEventListener('hashchange', handleRouting);
    return () => {
      window.removeEventListener('hashchange', handleRouting);
    };
  }, []);

  const handleScanComplete = () => {
    setScanToken((prev) => prev + 1);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'trending':
        return <TrendingPage scanToken={scanToken} />;
      case 'opportunities':
        return <OpportunityPage scanToken={scanToken} />;
      case 'detail':
        return <RepoAnalysis />;
      default:
        return <TrendingPage scanToken={scanToken} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">

      
      {/* Dynamic Rebranded Top Navigation */}
      <Navbar onScanComplete={handleScanComplete} />

      {/* Main Content Layout Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="transition-all duration-300">
          {renderContent()}
        </div>
      </main>

      {/* Footers */}
      <Footer />

    </div>
  );
};

export default App;
