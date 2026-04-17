import { create } from 'zustand';

interface PlaylistState {
  selectedPlaylistId: string | null;
  setSelected: (id: string | null) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  selectedPlaylistId: null,
  setSelected: (id) => set({ selectedPlaylistId: id }),
}));
