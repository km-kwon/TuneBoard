import { ListMusic, Mic2, Maximize2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';

export function ExtraControls() {
  const queueOpen = useUIStore((s) => s.panels.queue);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const openNowPlaying = usePlayerStore((s) => s.openNowPlaying);

  return (
    <div className="flex items-center gap-0.5">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
        aria-label="Lyrics"
        title="Lyrics (Phase 3)"
      >
        <Mic2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => togglePanel('queue')}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 ease-out-quart',
          queueOpen ? 'text-accent' : 'text-text-secondary hover:text-text-primary',
        )}
        aria-label="Queue"
        title="Queue"
      >
        <ListMusic className="h-4 w-4" />
      </button>
      <button
        onClick={openNowPlaying}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
        aria-label="Open Now Playing"
        title="Now Playing"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
