import { motion } from 'framer-motion';
import {
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Repeat1,
  Loader2,
} from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  size?: 'default' | 'large';
  /** Minimal mobile layout: prev · play · next only. */
  compact?: boolean;
}

export function PlaybackControls({ size = 'default', compact = false }: PlaybackControlsProps) {
  const status = usePlayerStore((s) => s.status);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const shuffleMode = usePlayerStore((s) => s.shuffleMode);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

  const loading = status === 'loading';
  const large = size === 'large';
  const [shuffleAnimKey, setShuffleAnimKey] = useState(0);

  return (
    <div className={cn('flex items-center', large ? 'gap-3' : 'gap-1.5')}>
      {!compact && (
        <IconBtn
          onClick={() => {
            toggleShuffle();
            setShuffleAnimKey((k) => k + 1);
          }}
          active={shuffleMode}
          aria-label="Shuffle"
          size={size}
        >
          <span
            key={shuffleAnimKey}
            className={cn('inline-flex', shuffleAnimKey > 0 && 'anim-shuffle-card')}
          >
            <Shuffle className={large ? 'h-5 w-5' : 'h-4 w-4'} />
          </span>
        </IconBtn>
      )}
      <IconBtn onClick={previous} aria-label="Previous track" size={size}>
        <SkipBack
          className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'}
          fill="currentColor"
          strokeWidth={0}
        />
      </IconBtn>

      <motion.button
        onClick={togglePlay}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.08 }}
        className={cn(
          'flex items-center justify-center rounded-full bg-text-primary text-surface-0 shadow-glow-sm transition-all duration-200 ease-out-quart hover:scale-[1.06] hover:bg-accent hover:text-text-onAccent hover:shadow-glow-md',
          large ? 'h-14 w-14' : 'h-9 w-9',
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {loading ? (
          <Loader2 className={cn('animate-spin', large ? 'h-6 w-6' : 'h-4 w-4')} strokeWidth={2.5} />
        ) : isPlaying ? (
          <Pause
            className={large ? 'h-6 w-6' : 'h-4 w-4'}
            fill="currentColor"
            strokeWidth={0}
          />
        ) : (
          <Play
            className={cn('translate-x-[1px]', large ? 'h-6 w-6' : 'h-4 w-4')}
            fill="currentColor"
            strokeWidth={0}
          />
        )}
      </motion.button>

      <IconBtn onClick={next} aria-label="Next track" size={size}>
        <SkipForward
          className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'}
          fill="currentColor"
          strokeWidth={0}
        />
      </IconBtn>
      {!compact && (
        <IconBtn
          onClick={toggleRepeat}
          active={repeatMode !== 'off'}
          aria-label={`Repeat: ${repeatMode}`}
          size={size}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className={large ? 'h-5 w-5' : 'h-4 w-4'} />
          ) : (
            <Repeat className={large ? 'h-5 w-5' : 'h-4 w-4'} />
          )}
        </IconBtn>
      )}
    </div>
  );
}

interface IconBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: 'default' | 'large';
  children: ReactNode;
}

function IconBtn({ active, size = 'default', children, className, ...props }: IconBtnProps) {
  const large = size === 'large';
  return (
    <button
      {...props}
      className={cn(
        'flex items-center justify-center rounded-full transition-colors duration-150 ease-out-quart',
        large ? 'h-11 w-11' : 'h-8 w-8',
        active ? 'text-accent' : 'text-text-secondary hover:text-text-primary',
        className,
      )}
    >
      {children}
    </button>
  );
}
