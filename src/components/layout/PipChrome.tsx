import { Maximize2, X, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { PIP_DIMENSIONS, useVideoStore } from '@/stores/videoStore';

const EDGE_PADDING = 8;

/**
 * Floating overlay rendered on top of the iframe in PiP mode. The iframe itself
 * eats pointer events, so the chrome lives in a sibling-ish overlay and uses
 * pointer events only for its own interactive bits.
 */
export function PipChrome() {
  const navigate = useNavigate();
  const setMode = useUIStore((s) => s.setMode);
  const setPipPosition = useVideoStore((s) => s.setPipPosition);
  const pipPosition = useVideoStore((s) => s.pipPosition);

  const dragStart = useRef<{ x: number; y: number; pipX: number; pipY: number } | null>(null);

  const expand = () => navigate('/video');
  const close = () => setMode('music');

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      pipX: pipPosition.x,
      pipY: pipPosition.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxX = vw - PIP_DIMENSIONS.width - EDGE_PADDING;
    const maxY = vh - PIP_DIMENSIONS.height - EDGE_PADDING;
    const nextX = Math.max(EDGE_PADDING, Math.min(maxX, dragStart.current.pipX - dx));
    const nextY = Math.max(EDGE_PADDING, Math.min(maxY, dragStart.current.pipY - dy));
    setPipPosition({ x: nextX, y: nextY });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragStart.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute left-0 right-0 top-0 z-10 flex h-7 cursor-grab items-center gap-1 bg-gradient-to-b from-black/75 to-transparent px-2 opacity-0 transition-opacity duration-200 hover:opacity-100 active:cursor-grabbing"
        title="Drag to move"
      >
        <GripVertical className="h-3.5 w-3.5 text-white/70" />
        <div className="flex-1" />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={expand}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Expand to full player"
          title="Expand"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={close}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Close mini player"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}
