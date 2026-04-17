import { create } from 'zustand';

interface SearchState {
  query: string;
  filter: 'all' | 'songs' | 'videos' | 'artists' | 'albums';
  setQuery: (q: string) => void;
  setFilter: (f: SearchState['filter']) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filter: 'all',
  setQuery: (q) => set({ query: q }),
  setFilter: (f) => set({ filter: f }),
  clear: () => set({ query: '' }),
}));
