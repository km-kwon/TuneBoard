import { cn } from '@/lib/utils';

interface MiniEqualizerProps {
  active?: boolean;
  bars?: number;
  className?: string;
}

/**
 * Tiny equalizer used next to the track title in the player bar.
 * Paused state collapses to a flat row of pips instead of stopping mid-animation.
 */
export function MiniEqualizer({ active = true, bars = 4, className }: MiniEqualizerProps) {
  const delays = [-0.1, -0.35, -0.6, -0.2, -0.45];
  const durations = [0.8, 1.05, 0.92, 1.1, 0.88];
  return (
    <div
      aria-hidden
      className={cn('inline-flex h-3 items-end gap-[2px]', className)}
      style={{ transform: 'translateZ(0)' }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'block w-[2px] rounded-[1px] bg-accent',
            active ? 'anim-viz-bar-mini' : 'opacity-60',
          )}
          style={{
            height: active ? '100%' : '30%',
            animationDelay: `${delays[i % delays.length]}s`,
            animationDuration: `${durations[i % durations.length]}s`,
          }}
        />
      ))}
    </div>
  );
}
