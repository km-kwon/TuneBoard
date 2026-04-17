import { useRef, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { formatTime, cn } from '@/lib/utils';

interface ProgressSliderProps {
  variant?: 'default' | 'large';
}

export function ProgressSlider({ variant = 'default' }: ProgressSliderProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const setScrubbing = usePlayerStore((s) => s.setScrubbing);

  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const value = dragValue ?? currentTime;
  const percent = duration > 0 ? (value / duration) * 100 : 0;
  const active = hoverPercent !== null || dragValue !== null;
  const large = variant === 'large';

  const ratioFromClient = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubbing(true);
    setDragValue(ratioFromClient(e.clientX) * duration);

    const onMove = (ev: PointerEvent) => {
      setDragValue(ratioFromClient(ev.clientX) * duration);
    };
    const onUp = (ev: PointerEvent) => {
      const final = ratioFromClient(ev.clientX) * duration;
      seek(final);
      setDragValue(null);
      setScrubbing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoverPercent(ratioFromClient(e.clientX) * 100);
  };

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3',
        large ? 'max-w-none' : 'max-w-[600px]',
      )}
    >
      <span
        className={cn(
          'shrink-0 text-right font-mono tabular-nums text-text-tertiary',
          large ? 'w-12 text-xs' : 'w-10 text-[11px]',
        )}
      >
        {formatTime(value)}
      </span>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={(e) => setHoverPercent(ratioFromClient(e.clientX) * 100)}
        onMouseLeave={() => setHoverPercent(null)}
        className="group relative flex h-5 flex-1 cursor-pointer touch-none select-none items-center"
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(value)}
      >
        {/* Tooltip */}
        {hoverPercent !== null && duration > 0 && (
          <div
            className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 rounded-xs border border-white/[0.06] bg-surface-4/90 px-2 py-1 font-mono text-[10.5px] tabular-nums text-text-primary shadow-2 backdrop-blur-md"
            style={{ left: `${hoverPercent}%` }}
          >
            {formatTime((hoverPercent / 100) * duration)}
          </div>
        )}

        {/* Track */}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-surface-3 transition-all duration-200 ease-out-quart',
            active ? 'h-1.5' : 'h-1',
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-colors duration-200',
              active ? 'gradient-accent' : 'bg-text-secondary',
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className={cn(
            'pointer-events-none absolute -translate-x-1/2 rounded-full bg-text-primary shadow-glow-sm transition-opacity duration-150',
            large ? 'h-4 w-4' : 'h-3 w-3',
            active ? 'opacity-100' : 'opacity-0',
          )}
          style={{ left: `${percent}%` }}
        />
      </div>

      <span
        className={cn(
          'shrink-0 font-mono tabular-nums text-text-tertiary',
          large ? 'w-12 text-xs' : 'w-10 text-[11px]',
        )}
      >
        {formatTime(duration)}
      </span>
    </div>
  );
}
