import { useMemo } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

/**
 * Visualizer variants. All driven by CSS keyframes — the YouTube IFrame API
 * doesn't expose PCM data, so we simulate musically plausible motion instead.
 * Bars are procedurally seeded per-mount so each track change produces a
 * slightly different frequency pattern.
 */
export function AudioVisualizer({ color }: { color?: { r: number; g: number; b: number } }) {
  const kind = useUIStore((s) => s.visualizer);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const videoId = usePlayerStore((s) => s.currentTrack?.videoId);

  if (kind === 'off' || !isPlaying) return null;

  if (kind === 'waveform') return <Waveform videoId={videoId} />;
  if (kind === 'circular') return <Circular videoId={videoId} color={color} />;
  if (kind === 'particles') return <Particles videoId={videoId} color={color} />;
  return <GradientWave color={color} />;
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = (h ^ seed.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967295;
  };
}

function Waveform({ videoId }: { videoId?: string }) {
  const bars = useMemo(() => {
    const r = rng(videoId ?? 'default');
    return Array.from({ length: 64 }, (_, i) => {
      const base = 0.35 + r() * 0.55;
      // emphasise mids slightly to mimic typical music spectrums
      const mid = 1 - Math.abs((i - 32) / 32);
      return {
        height: Math.min(1, base * (0.6 + mid * 0.5)),
        duration: 0.7 + r() * 0.9,
        delay: -r() * 1.2,
      };
    });
  }, [videoId]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex h-[42%] items-end justify-center gap-[3px] px-8 opacity-60"
    >
      {bars.map((b, i) => (
        <span
          key={i}
          className="anim-viz-bar block w-[6px] rounded-t-full"
          style={{
            height: `${b.height * 100}%`,
            background: 'linear-gradient(to top, rgb(var(--accent-500) / 0.85), rgb(var(--hot-500) / 0.3))',
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Circular({ videoId, color }: { videoId?: string; color?: { r: number; g: number; b: number } }) {
  const bars = useMemo(() => {
    const r = rng((videoId ?? '') + ':c');
    return Array.from({ length: 72 }, (_, i) => ({
      angle: (i * 360) / 72,
      scale: 0.4 + r() * 0.7,
      duration: 0.8 + r() * 1.0,
      delay: -r() * 1.4,
    }));
  }, [videoId]);
  const c = color ? `${color.r} ${color.g} ${color.b}` : 'var(--accent-500)';
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
    >
      {bars.map((b, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-[86px] w-[3px] origin-bottom"
          style={{
            transform: `translate(-50%, -260px) rotate(${b.angle}deg)`,
          }}
        >
          <span
            className="anim-viz-bar block h-full w-full rounded-full opacity-70"
            style={{
              background: `linear-gradient(to top, rgb(${c} / 0.9), rgb(${c} / 0.05))`,
              transform: `scaleY(${b.scale})`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

function Particles({ videoId, color }: { videoId?: string; color?: { r: number; g: number; b: number } }) {
  const particles = useMemo(() => {
    const r = rng((videoId ?? '') + ':p');
    return Array.from({ length: 36 }, () => {
      const startX = r() * 100;
      const driftX = (r() - 0.5) * 14;
      return {
        left: startX,
        drift: driftX,
        size: 3 + r() * 5,
        duration: 5 + r() * 5,
        delay: -r() * 8,
        opacity: 0.4 + r() * 0.5,
      };
    });
  }, [videoId]);
  const c = color ? `${color.r} ${color.g} ${color.b}` : 'var(--accent-500)';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 block rounded-full blur-[1px]"
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `radial-gradient(circle, rgb(${c} / 0.95), rgb(${c} / 0))`,
              animation: `particle-float ${p.duration}s ease-in infinite`,
              animationDelay: `${p.delay}s`,
              '--px': '0px',
              '--px-end': `${p.drift}vw`,
              '--pOpacity': p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function GradientWave({ color }: { color?: { r: number; g: number; b: number } }) {
  const c = color ? `${color.r} ${color.g} ${color.b}` : 'var(--accent-500)';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className={cn('anim-gradient-wave absolute -inset-[20%] opacity-70')}
        style={{
          background: `radial-gradient(ellipse at 30% 70%, rgb(${c} / 0.35), transparent 60%), radial-gradient(ellipse at 70% 40%, rgb(${c} / 0.25), transparent 55%)`,
        }}
      />
      <div
        className="anim-gradient-wave absolute -inset-[10%] opacity-50"
        style={{
          animationDuration: '11s',
          animationDirection: 'reverse',
          background: `radial-gradient(ellipse at 60% 80%, rgb(${c} / 0.22), transparent 55%)`,
        }}
      />
    </div>
  );
}
