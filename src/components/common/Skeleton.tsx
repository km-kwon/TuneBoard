import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm bg-surface-2',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r',
        'before:from-transparent before:via-white/[0.04] before:to-transparent',
        className,
      )}
    />
  );
}
