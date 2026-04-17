import { useEffect } from 'react';
import { AppShell } from '@/layouts/AppShell';
import { useGlobalShortcuts } from '@/hooks/useShortcuts';
import { useUIStore } from '@/stores/uiStore';

export default function App() {
  useGlobalShortcuts();
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <AppShell />;
}
