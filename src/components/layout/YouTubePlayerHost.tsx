import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useUIStore } from '@/stores/uiStore';
import { PIP_DIMENSIONS, useVideoStore } from '@/stores/videoStore';
import { PipChrome } from './PipChrome';

type HostMode = 'hidden' | 'stage' | 'pip';

interface HostStyle {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
  opacity: number;
  boxShadow: string;
}

const HIDDEN_STYLE: HostStyle = {
  top: -10000,
  left: -10000,
  width: 1,
  height: 1,
  borderRadius: 0,
  opacity: 0,
  boxShadow: 'none',
};

/**
 * Single shared YouTube iframe positioned via fixed CSS. Animates between three
 * visible modes — hidden (audio-only music mode), stage (over the VideoStage
 * placeholder on /video), and PiP (corner mini player). Moving the iframe in the
 * DOM would force a reload, so we always keep it in the same parent and morph
 * its position instead.
 */
export function YouTubePlayerHost() {
  const ref = useYouTubePlayer();
  const mode = useUIStore((s) => s.mode);
  const location = useLocation();
  const stageRect = useVideoStore((s) => s.stageRect);
  const pipPosition = useVideoStore((s) => s.pipPosition);

  const hostMode: HostMode = useMemo(() => {
    if (mode !== 'video') return 'hidden';
    const onVideoPage = location.pathname.startsWith('/video');
    if (onVideoPage && stageRect) return 'stage';
    return 'pip';
  }, [mode, location.pathname, stageRect]);

  const target: HostStyle = useMemo(() => {
    if (hostMode === 'hidden') return HIDDEN_STYLE;
    if (hostMode === 'stage' && stageRect) {
      return {
        top: stageRect.top,
        left: stageRect.left,
        width: stageRect.width,
        height: stageRect.height,
        borderRadius: 8,
        opacity: 1,
        boxShadow: '0 20px 60px -20px rgb(0 0 0 / 0.6)',
      };
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
    const left = Math.max(8, vw - PIP_DIMENSIONS.width - pipPosition.x);
    const top = Math.max(8, vh - PIP_DIMENSIONS.height - pipPosition.y);
    return {
      top,
      left,
      width: PIP_DIMENSIONS.width,
      height: PIP_DIMENSIONS.height,
      borderRadius: 12,
      opacity: 1,
      boxShadow: '0 20px 50px -10px rgb(0 0 0 / 0.55), 0 0 0 1px rgb(255 255 255 / 0.06)',
    };
  }, [hostMode, stageRect, pipPosition]);

  return (
    <motion.div
      aria-hidden={hostMode === 'hidden'}
      animate={{ ...target }}
      transition={{ duration: 0.42, ease: [0.19, 1, 0.22, 1] }}
      className="fixed z-40 overflow-hidden bg-black"
      style={{
        pointerEvents: hostMode === 'hidden' ? 'none' : 'auto',
      }}
    >
      <div ref={ref} className="h-full w-full" />
      {hostMode === 'pip' && <PipChrome />}
    </motion.div>
  );
}
