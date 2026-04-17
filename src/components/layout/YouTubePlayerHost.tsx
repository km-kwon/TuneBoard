import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

/**
 * Hidden iframe host. The IFrame Player API replaces the inner div with an
 * iframe on player creation, so we wrap it in a fixed-size invisible shell
 * that stays out of the layout flow.
 */
export function YouTubePlayerHost() {
  const ref = useYouTubePlayer();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
    >
      <div ref={ref} />
    </div>
  );
}
