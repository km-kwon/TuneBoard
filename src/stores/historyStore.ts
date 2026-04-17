import { create } from 'zustand';
import type { Track } from '@/types';

export interface HistoryEntry {
  track: Track;
  playedAt: number;
  source?: string;
  listenedSec: number;
}

interface HistoryState {
  entries: HistoryEntry[];
  push: (entry: HistoryEntry) => void;
  clear: () => void;
}

const MAX_ENTRIES = 500;

export const useHistoryStore = create<HistoryState>((set) => ({
  entries: [],
  push: (entry) =>
    set((s) => ({
      entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
    })),
  clear: () => set({ entries: [] }),
}));
