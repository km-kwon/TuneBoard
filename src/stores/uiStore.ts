import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppMode, ThemeName } from '@/types';

interface UIState {
  theme: ThemeName;
  sidebarCollapsed: boolean;
  mode: AppMode;
  panels: {
    queue: boolean;
    lyrics: boolean;
  };

  setTheme: (t: ThemeName) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMode: (m: AppMode) => void;
  togglePanel: (key: keyof UIState['panels']) => void;
  closePanel: (key: keyof UIState['panels']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'amber',
      sidebarCollapsed: false,
      mode: 'music',
      panels: {
        queue: false,
        lyrics: false,
      },

      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t);
        set({ theme: t });
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMode: (m) => set({ mode: m }),
      togglePanel: (key) =>
        set((s) => ({ panels: { ...s.panels, [key]: !s.panels[key] } })),
      closePanel: (key) => set((s) => ({ panels: { ...s.panels, [key]: false } })),
    }),
    {
      name: 'tuneboard.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
