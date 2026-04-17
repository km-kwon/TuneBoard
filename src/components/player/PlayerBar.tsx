import { motion, useReducedMotion } from 'framer-motion';
import { ChevronUp, Maximize2, Video } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { NowPlayingMeta } from './NowPlayingMeta';
import { PlaybackControls } from './PlaybackControls';
import { ProgressSlider } from './ProgressSlider';
import { VolumeControl } from './VolumeControl';
import { ExtraControls } from './ExtraControls';
import { LikeButton } from './LikeButton';

export function PlayerBar() {
  const openNowPlaying = usePlayerStore((s) => s.openNowPlaying);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const liked = usePlayerStore((s) =>
    currentTrack ? s.likedIds.includes(currentTrack.videoId) : false,
  );
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const mode = useUIStore((s) => s.mode);
  const navigate = useNavigate();
  const location = useLocation();
  const isVideoMode = mode === 'video';
  const onVideoPage = location.pathname === '/video';
  const reduceMotion = useReducedMotion();

  const onMetaClick = () => {
    if (isVideoMode) {
      if (!onVideoPage) navigate('/video');
    } else {
      openNowPlaying();
    }
  };

  return (
    <motion.footer
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.12, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      drag={reduceMotion ? false : 'y'}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.25, bottom: 0 }}
      dragDirectionLock
      onDragEnd={(_, info) => {
        if (info.offset.y < -60 || info.velocity.y < -400) openNowPlaying();
      }}
      className="relative z-30 flex min-h-player-bar shrink-0 flex-col items-stretch gap-1 border-t border-white/[0.04] bg-surface-1/85 px-3 py-2 backdrop-blur-2xl md:h-player-bar md:min-h-0 md:flex-row md:items-center md:gap-6 md:px-4 md:py-0"
    >
      {/* Mobile: compact single row */}
      <div className="flex items-center gap-2 md:hidden">
        {isVideoMode && (
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">
            <Video className="h-2.5 w-2.5" />
            Video
          </span>
        )}
        <button
          onClick={onMetaClick}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left transition-colors active:bg-surface-2/60"
          aria-label="Open Now Playing"
        >
          <NowPlayingMeta compact />
          <ChevronUp className="h-4 w-4 shrink-0 text-text-tertiary" />
        </button>
        <LikeButton
          liked={liked}
          disabled={!currentTrack}
          size="sm"
          onToggle={() => currentTrack && toggleLike(currentTrack.videoId)}
        />
        <PlaybackControls compact />
      </div>
      <div className="md:hidden">
        <ProgressSlider variant="thin" />
      </div>

      {/* Desktop / tablet: three-column */}
      <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
        {isVideoMode && (
          <span className="ml-1 flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
            <Video className="h-3 w-3" />
            Video
          </span>
        )}
        <button
          onClick={onMetaClick}
          className="group flex min-w-0 items-center gap-3 rounded-md p-1 pr-3 transition-colors hover:bg-surface-2/60"
          aria-label={isVideoMode ? 'Expand video' : 'Open Now Playing'}
        >
          <NowPlayingMeta />
          {isVideoMode ? (
            <Maximize2 className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </button>
        <LikeButton
          liked={liked}
          disabled={!currentTrack}
          size="sm"
          onToggle={() => currentTrack && toggleLike(currentTrack.videoId)}
        />
      </div>

      <div className="hidden flex-[1.4] flex-col items-center gap-1.5 md:flex">
        <PlaybackControls />
        <ProgressSlider />
      </div>

      <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
        <ExtraControls />
        <VolumeControl />
      </div>
    </motion.footer>
  );
}
