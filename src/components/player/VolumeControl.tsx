import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';

export function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const [hover, setHover] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [bounceKey, setBounceKey] = useState(0);
  const firstRender = useRef(true);
  const prevMuted = useRef(isMuted);

  // Bounce the icon whenever mute/silent state transitions.
  const silent = isMuted || volume === 0;
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      prevMuted.current = silent;
      return;
    }
    if (silent !== prevMuted.current) {
      setBounceKey((k) => k + 1);
      prevMuted.current = silent;
    }
  }, [silent]);

  const displayVolume = isMuted ? 0 : volume;
  const Icon = silent ? VolumeX : displayVolume < 40 ? Volume1 : Volume2;

  const valueFromClient = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setVolume(valueFromClient(e.clientX));

    const onMove = (ev: PointerEvent) => setVolume(valueFromClient(ev.clientX));
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-2"
    >
      <button
        onClick={toggleMute}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          silent ? 'text-hot hover:text-hot/80' : 'text-text-secondary hover:text-text-primary',
        )}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        aria-pressed={silent}
      >
        <span key={bounceKey} className={cn('relative inline-flex', bounceKey > 0 && 'anim-mute-bounce')}>
          <Icon className="h-4 w-4" />
          {silent && (
            <svg
              aria-hidden
              className="absolute -right-1 -top-1 h-3 w-3 text-hot"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <circle cx="6" cy="6" r="5" fill="rgb(var(--surface-1))" stroke="currentColor" />
              <path d="M3.5 3.5 L8.5 8.5 M8.5 3.5 L3.5 8.5" />
            </svg>
          )}
        </span>
      </button>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative flex h-4 w-24 cursor-pointer touch-none select-none items-center"
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayVolume}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-surface-3 transition-all duration-200 ease-out-quart',
            hover ? 'h-1.5' : 'h-1',
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-colors duration-200',
              hover ? 'gradient-accent' : 'bg-text-secondary',
            )}
            style={{ width: `${displayVolume}%` }}
          />
        </div>
        <div
          className={cn(
            'pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-text-primary shadow-glow-sm transition-opacity duration-150',
            hover ? 'opacity-100' : 'opacity-0',
          )}
          style={{ left: `${displayVolume}%` }}
        />
      </div>
    </div>
  );
}
