import { Music2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { Marquee } from './Marquee';
import { MiniEqualizer } from './MiniEqualizer';

export function NowPlayingMeta({ compact = false }: { compact?: boolean } = {}) {
  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const thumbSize = compact ? 'h-10 w-10' : 'h-14 w-14';

  if (!track) {
    return (
      <>
        <div className={`flex ${thumbSize} shrink-0 items-center justify-center rounded-sm bg-surface-3`}>
          <Music2 className="h-5 w-5 text-text-tertiary" />
        </div>
        <div className="flex min-w-0 flex-col items-start text-left">
          <p className="text-sm font-semibold text-text-secondary">Nothing playing</p>
          {!compact && <p className="text-xs text-text-tertiary">Pick a track to start</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`relative ${thumbSize} shrink-0 overflow-hidden rounded-sm bg-surface-3 shadow-1`}
        style={{ perspective: '400px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={track.videoId}
            initial={{ opacity: 0, rotateY: -45, scale: 0.96 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: 45, scale: 0.96 }}
            transition={{ duration: 0.38, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 [transform-style:preserve-3d]"
          >
            {track.thumbnailUrl ? (
              <img
                src={track.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <>
                <div className="absolute inset-0 gradient-accent opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-bold text-text-primary/85">
                    {track.title.charAt(0)}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex min-w-0 flex-col items-start text-left">
        <div className="flex items-center gap-1.5">
          <Marquee
            text={track.title}
            className={`${compact ? 'max-w-[140px]' : 'max-w-[180px]'} text-sm font-semibold leading-tight text-text-primary`}
          />
          <MiniEqualizer active={isPlaying} className="shrink-0" />
        </div>
        <Marquee
          text={track.artists.map((a) => a.name).join(', ')}
          className={`mt-0.5 ${compact ? 'max-w-[160px]' : 'max-w-[200px]'} text-xs text-text-secondary`}
        />
      </div>
    </>
  );
}
