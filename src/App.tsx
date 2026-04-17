import { useEffect } from 'react';
import { AppShell } from '@/layouts/AppShell';
import { useGlobalShortcuts } from '@/hooks/useShortcuts';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useUIStore } from '@/stores/uiStore';

export default function App() {
  useGlobalShortcuts();
  useMediaSession();
  const theme = useUIStore((s) => s.theme);

  // Reassert theme attribute on mount — store rehydration runs custom theme
  // CSS variable injection, but the data-theme attribute still needs to be set
  // because it's not persisted on the DOM across reloads.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <AppShell />;
}
