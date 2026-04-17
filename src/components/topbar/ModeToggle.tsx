import { motion } from 'framer-motion';
import { Music2, Video } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { AppMode } from '@/types';

const TABS: { key: AppMode; label: string; icon: typeof Music2 }[] = [
  { key: 'music', label: 'Music', icon: Music2 },
  { key: 'video', label: 'Video', icon: Video },
];

export function ModeToggle() {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const navigate = useNavigate();
  const location = useLocation();

  const choose = (next: AppMode) => {
    setMode(next);
    if (next === 'video' && location.pathname !== '/video') {
      navigate('/video');
    }
    if (next === 'music' && location.pathname === '/video') {
      navigate('/');
    }
  };

  return (
    <div
      className="relative flex h-9 items-center rounded-full border border-white/[0.06] bg-surface-2/70 p-0.5"
      role="tablist"
      aria-label="Playback mode"
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => choose(key)}
            className={cn(
              'relative z-10 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
              active ? 'text-text-onAccent' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-toggle-indicator"
                className="absolute inset-0 -z-10 rounded-full bg-accent shadow-glow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
