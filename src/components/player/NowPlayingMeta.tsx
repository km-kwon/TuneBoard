import { Music2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { Marquee } from './Marquee';

export function NowPlayingMeta() {
  const track = usePlayerStore((s) => s.currentTrack);

  if (!track) {
    return (
      <>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-surface-3">
          <Music2 className="h-5 w-5 text-text-tertiary" />
        </div>
        <div className="flex min-w-0 flex-col items-start text-left">
          <p className="text-sm font-semibold text-text-secondary">Nothing playing</p>
          <p className="text-xs text-text-tertiary">Pick a track to start</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-surface-3 shadow-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={track.videoId}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0"
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
        <Marquee
          text={track.title}
          className="max-w-[200px] text-sm font-semibold leading-tight text-text-primary"
        />
        <Marquee
          text={track.artists.map((a) => a.name).join(', ')}
          className="mt-0.5 max-w-[200px] text-xs text-text-secondary"
        />
      </div>
    </>
  );
}
