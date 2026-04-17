import { motion } from 'framer-motion';
import { ChevronUp, Heart } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { NowPlayingMeta } from './NowPlayingMeta';
import { PlaybackControls } from './PlaybackControls';
import { ProgressSlider } from './ProgressSlider';
import { VolumeControl } from './VolumeControl';
import { ExtraControls } from './ExtraControls';

export function PlayerBar() {
  const openNowPlaying = usePlayerStore((s) => s.openNowPlaying);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const liked = usePlayerStore((s) =>
    currentTrack ? s.likedIds.includes(currentTrack.videoId) : false,
  );
  const toggleLike = usePlayerStore((s) => s.toggleLike);

  return (
    <motion.footer
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.12, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      className="relative z-30 flex h-player-bar shrink-0 items-center gap-6 border-t border-white/[0.04] bg-surface-1/85 px-4 backdrop-blur-2xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          onClick={openNowPlaying}
          className="group flex min-w-0 items-center gap-3 rounded-md p-1 pr-3 transition-colors hover:bg-surface-2/60"
          aria-label="Open Now Playing"
        >
          <NowPlayingMeta />
          <ChevronUp className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <button
          onClick={() => currentTrack && toggleLike(currentTrack.videoId)}
          disabled={!currentTrack}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            liked
              ? 'text-accent hover:text-accent/80'
              : 'text-text-tertiary hover:text-text-primary disabled:opacity-30',
          )}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-[1.4] flex-col items-center gap-1.5">
        <PlaybackControls />
        <ProgressSlider />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <ExtraControls />
        <VolumeControl />
      </div>
    </motion.footer>
  );
}
