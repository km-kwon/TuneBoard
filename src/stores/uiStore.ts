import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppMode, CustomTheme, ThemeName, VisualizerKind } from '@/types';

interface UIState {
  theme: ThemeName;
  customTheme: CustomTheme;
  visualizer: VisualizerKind;
  sidebarCollapsed: boolean;
  mode: AppMode;
  panels: {
    queue: boolean;
    lyrics: boolean;
  };

  setTheme: (t: ThemeName) => void;
  setCustomTheme: (patch: Partial<CustomTheme>) => void;
  setVisualizer: (v: VisualizerKind) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMode: (m: AppMode) => void;
  togglePanel: (key: keyof UIState['panels']) => void;
  closePanel: (key: keyof UIState['panels']) => void;
}

const DEFAULT_CUSTOM: CustomTheme = {
  accentR: 255,
  accentG: 159,
  accentB: 64,
  hotR: 255,
  hotG: 107,
  hotB: 92,
  brightness: 1,
};

function applyCustomTheme(c: CustomTheme) {
  const root = document.documentElement;
  const b = Math.max(0.6, Math.min(1.4, c.brightness));
  const scale = (n: number) => Math.round(n * b);
  root.style.setProperty('--accent-400', `${Math.min(255, c.accentR + 24)} ${Math.min(255, c.accentG + 24)} ${Math.min(255, c.accentB + 24)}`);
  root.style.setProperty('--accent-500', `${c.accentR} ${c.accentG} ${c.accentB}`);
  root.style.setProperty('--accent-600', `${Math.max(0, c.accentR - 24)} ${Math.max(0, c.accentG - 24)} ${Math.max(0, c.accentB - 24)}`);
  root.style.setProperty('--accent-glow', `${c.accentR} ${c.accentG} ${c.accentB}`);
  root.style.setProperty('--hot-500', `${c.hotR} ${c.hotG} ${c.hotB}`);
  root.style.setProperty('--surface-0', `${scale(12)} ${scale(13)} ${scale(16)}`);
  root.style.setProperty('--surface-1', `${scale(17)} ${scale(18)} ${scale(22)}`);
  root.style.setProperty('--surface-2', `${scale(23)} ${scale(24)} ${scale(29)}`);
  root.style.setProperty('--surface-3', `${scale(32)} ${scale(33)} ${scale(40)}`);
  root.style.setProperty('--surface-4', `${scale(44)} ${scale(45)} ${scale(54)}`);
}

function clearCustomThemeInline() {
  const root = document.documentElement;
  const keys = [
    '--accent-400', '--accent-500', '--accent-600', '--accent-glow', '--hot-500',
    '--surface-0', '--surface-1', '--surface-2', '--surface-3', '--surface-4',
  ];
  keys.forEach((k) => root.style.removeProperty(k));
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'amber',
      customTheme: DEFAULT_CUSTOM,
      visualizer: 'waveform',
      sidebarCollapsed: false,
      mode: 'music',
      panels: {
        queue: false,
        lyrics: false,
      },

      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t);
        if (t === 'custom') {
          applyCustomTheme(get().customTheme);
        } else {
          clearCustomThemeInline();
        }
        set({ theme: t });
      },
      setCustomTheme: (patch) => {
        const next = { ...get().customTheme, ...patch };
        set({ customTheme: next });
        if (get().theme === 'custom') applyCustomTheme(next);
      },
      setVisualizer: (v) => set({ visualizer: v }),
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
        customTheme: s.customTheme,
        visualizer: s.visualizer,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'custom') applyCustomTheme(state.customTheme);
      },
    },
  ),
);
