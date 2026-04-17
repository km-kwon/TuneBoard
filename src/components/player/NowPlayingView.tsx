import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Share2, MoreHorizontal, Music2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { extractDominantColor, type RGB } from '@/lib/colorExtract';
import { cn } from '@/lib/utils';
import { PlaybackControls } from './PlaybackControls';
import { ProgressSlider } from './ProgressSlider';
import { VolumeControl } from './VolumeControl';
import { LyricsPanel } from './LyricsPanel';
import { AudioVisualizer } from './AudioVisualizer';
import { LikeButton } from './LikeButton';
import { VisualizerPicker } from './VisualizerPicker';

const FALLBACK: RGB = { r: 255, g: 159, b: 64 }; // matches --accent-500

export function NowPlayingView() {
  const track = usePlayerStore((s) => s.currentTrack);
  const close = usePlayerStore((s) => s.closeNowPlaying);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const liked = usePlayerStore((s) =>
    track ? s.likedIds.includes(track.videoId) : false,
  );
  const toggleLike = usePlayerStore((s) => s.toggleLike);

  const [color, setColor] = useState<RGB>(FALLBACK);

  useEffect(() => {
    if (!track?.thumbnailUrl) {
      setColor(FALLBACK);
      return;
    }
    let cancelled = false;
    extractDominantColor(track.thumbnailUrl).then((c) => {
      if (!cancelled) setColor(c ?? FALLBACK);
    });
    return () => {
      cancelled = true;
    };
  }, [track?.thumbnailUrl]);

  const cssRgb = `${color.r} ${color.g} ${color.b}`;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.42, ease: [0.19, 1, 0.22, 1] }}
      className="absolute inset-0 z-50 flex flex-col bg-surface-0"
    >
      {/* Dominant-color wash. Smoothly transitions when track changes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden transition-[background] duration-700 ease-out-expo"
        style={{
          background: `radial-gradient(ellipse at top, rgb(${cssRgb} / 0.45) 0%, rgb(${cssRgb} / 0.15) 40%, transparent 70%), linear-gradient(to bottom, rgb(${cssRgb} / 0.12) 0%, transparent 50%)`,
        }}
      >
        <div
          className="absolute -top-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-30 blur-[160px] transition-all duration-700"
          style={{ background: `rgb(${cssRgb})` }}
        />
      </div>

      <AudioVisualizer color={color} />

      {/* Top bar */}
      <div className="relative flex h-16 shrink-0 items-center justify-between px-4 md:px-6">
        <button
          onClick={close}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label="Close Now Playing"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
          Now Playing
        </p>
        <div className="flex items-center gap-2">
          <VisualizerPicker />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="relative grid flex-1 grid-cols-1 gap-6 overflow-y-auto px-4 pb-6 md:gap-8 md:overflow-hidden md:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-12">
        {/* Cover */}
        <div className="flex items-center justify-center" style={{ perspective: '1400px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={track?.videoId ?? 'empty'}
              initial={{ opacity: 0, rotateY: -55, scale: 0.9 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: 55, scale: 0.9 }}
              transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
              className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-lg shadow-3 [transform-style:preserve-3d]"
              style={{ boxShadow: `0 30px 80px -20px rgb(${cssRgb} / 0.55)` }}
            >
              {track?.thumbnailUrl ? (
                <img
                  src={track.thumbnailUrl}
                  alt=""
                  className={cn(
                    'h-full w-full object-cover transition-transform duration-[1500ms] ease-out',
                    isPlaying && 'scale-[1.02]',
                  )}
                  draggable={false}
                />
              ) : (
                <>
                  <div className="absolute inset-0 gradient-accent opacity-75" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {track ? (
                      <span className="font-display text-[10rem] font-bold leading-none text-text-primary/25">
                        {track.title.charAt(0)}
                      </span>
                    ) : (
                      <Music2 className="h-24 w-24 text-text-primary/30" />
                    )}
                  </div>
                </>
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right column: meta + lyrics placeholder */}
        <div className="flex min-h-0 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={track?.videoId ?? 'empty'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
              className="shrink-0"
            >
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
                {track?.album?.name ?? 'Single'}
              </p>
              <h2 className="font-display text-2xl font-bold leading-tight tracking-tight md:text-4xl">
                {track?.title ?? 'Nothing playing'}
              </h2>
              <p className="mt-2 text-base text-text-secondary">
                {track?.artists.map((a) => a.name).join(', ') ?? '—'}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 flex shrink-0 items-center gap-2">
            <LikeButton
              liked={liked}
              disabled={!track}
              onToggle={() => track && toggleLike(track.videoId)}
            />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-primary"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <LyricsPanel />
        </div>
      </div>

      {/* Bottom transport */}
      <div className="relative flex shrink-0 flex-col items-center gap-3 px-4 pb-6 pt-2 md:px-6 md:pb-10 lg:px-12">
        <PlaybackControls size="large" />
        <div className="flex w-full max-w-3xl items-center gap-4">
          <div className="flex-1">
            <ProgressSlider variant="large" />
          </div>
        </div>
        <div className="absolute bottom-10 right-6 hidden md:block lg:right-12">
          <VolumeControl />
        </div>
      </div>
    </motion.div>
  );
}
