import { useEffect, useRef } from 'react';
import { useVideoStore } from '@/stores/videoStore';

/**
 * Empty 16:9 placeholder that reports its viewport-relative bounds to the
 * video store. The actual video iframe is positioned over this rect by
 * YouTubePlayerHost. Re-publishes on resize/scroll so the iframe tracks
 * layout shifts and window resizes smoothly.
 */
export function VideoStage() {
  const elRef = useRef<HTMLDivElement>(null);
  const setStageRect = useVideoStore((s) => s.setStageRect);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const publish = () => {
      const r = el.getBoundingClientRect();
      setStageRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    publish();

    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener('resize', publish);
    window.addEventListener('scroll', publish, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', publish);
      window.removeEventListener('scroll', publish, true);
      setStageRect(null);
    };
  }, [setStageRect]);

  return (
    <div
      ref={elRef}
      className="relative w-full overflow-hidden rounded-md bg-black"
      style={{ aspectRatio: '16 / 9' }}
    />
  );
}
