import { Heart } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Burst {
  id: number;
  particles: {
    txStart: number;
    tyStart: number;
    txEnd: number;
    tyEnd: number;
    rot: number;
    delay: number;
    duration: number;
    size: number;
  }[];
}

interface LikeButtonProps {
  liked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function LikeButton({
  liked,
  onToggle,
  disabled,
  size = 'md',
  className,
  ariaLabel,
}: LikeButtonProps) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seqRef = useRef(0);

  const spawn = () => {
    const id = ++seqRef.current;
    const count = 8;
    const particles = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const distance = 22 + Math.random() * 14;
      return {
        txStart: 0,
        tyStart: 0,
        txEnd: Math.cos(angle) * distance,
        tyEnd: Math.sin(angle) * distance - 8,
        rot: (Math.random() - 0.5) * 90,
        delay: Math.random() * 40,
        duration: 520 + Math.random() * 200,
        size: 6 + Math.random() * 4,
      };
    });
    setBursts((list) => [...list, { id, particles }]);
    window.setTimeout(() => {
      setBursts((list) => list.filter((b) => b.id !== id));
    }, 900);
  };

  const handle = () => {
    if (disabled) return;
    if (!liked) spawn();
    onToggle();
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const boxSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <button
      onClick={handle}
      disabled={disabled}
      aria-label={ariaLabel ?? (liked ? 'Unlike' : 'Like')}
      aria-pressed={liked}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-colors',
        boxSize,
        liked
          ? 'text-accent hover:text-accent/80'
          : 'text-text-tertiary hover:text-text-primary disabled:opacity-30',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('pointer-events-none relative', liked && 'anim-heart-scale')}
        key={liked ? 'on' : 'off'}
      >
        <Heart className={iconSize} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
      </span>

      <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {bursts.map((burst) =>
          burst.particles.map((p, i) => (
            <span
              key={`${burst.id}-${i}`}
              className="absolute"
              style={
                {
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: 'rgb(var(--accent-500))',
                  borderRadius: '9999px',
                  animation: `heart-burst ${p.duration}ms cubic-bezier(0.19, 1, 0.22, 1) forwards`,
                  animationDelay: `${p.delay}ms`,
                  boxShadow: '0 0 8px rgb(var(--accent-glow) / 0.7)',
                  '--tx-start': `${p.txStart}px`,
                  '--ty-start': `${p.tyStart}px`,
                  '--tx-end': `${p.txEnd}px`,
                  '--ty-end': `${p.tyEnd}px`,
                  '--rot': `${p.rot}deg`,
                } as React.CSSProperties
              }
            />
          )),
        )}
      </span>
    </button>
  );
}
