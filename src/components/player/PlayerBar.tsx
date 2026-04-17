import { motion } from 'framer-motion';
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
      className="relative z-30 flex h-player-bar shrink-0 items-center gap-6 border-t border-white/[0.04] bg-surface-1/85 px-4 backdrop-blur-2xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
