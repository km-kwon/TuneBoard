import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const PIP_DIMENSIONS = { width: 360, height: 203 } as const;

export interface StageRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PipPos {
  /** px from right edge of viewport */
  x: number;
  /** px from bottom edge of viewport */
  y: number;
}

interface VideoState {
  stageRect: StageRect | null;
  pipPosition: PipPos;
  setStageRect: (r: StageRect | null) => void;
  setPipPosition: (p: PipPos) => void;
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set) => ({
      stageRect: null,
      pipPosition: { x: 24, y: 110 },
      setStageRect: (r) => set({ stageRect: r }),
      setPipPosition: (p) => set({ pipPosition: p }),
    }),
    {
      name: 'tuneboard.video',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ pipPosition: s.pipPosition }),
    },
  ),
);
