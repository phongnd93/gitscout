import { create } from 'zustand';
import type { Repository } from '../types/github';


interface FilterState {
  currentPage: 'trending' | 'opportunities' | 'detail';
  currentCategory: string;
  currentTimeRange: 'today' | 'week' | 'month';
  searchQuery: string;
  currentOppType: string;
  selectedLanguage: string;
  theme: 'dark' | 'light';
  selectedRepo: Repository | null;
  
  // Actions
  setCurrentPage: (page: 'trending' | 'opportunities' | 'detail') => void;
  setCurrentCategory: (category: string) => void;
  setCurrentTimeRange: (range: 'today' | 'week' | 'month') => void;
  setSearchQuery: (query: string) => void;
  setCurrentOppType: (type: string) => void;
  setSelectedLanguage: (lang: string) => void;
  setSelectedRepo: (repo: Repository | null) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  currentPage: 'trending',
  currentCategory: 'all',
  currentTimeRange: 'today',
  searchQuery: '',
  currentOppType: 'all',
  selectedLanguage: 'all',
  theme: 'dark',
  selectedRepo: null,

  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentCategory: (category) => set({ currentCategory: category }),
  setCurrentTimeRange: (range) => set({ currentTimeRange: range }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentOppType: (type) => set({ currentOppType: type }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  initTheme: () => {
    const saved = localStorage.getItem('theme') || 'dark';
    set({ theme: saved as 'dark' | 'light' });
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}));
