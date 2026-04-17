import { useEffect, useMemo, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useLyrics } from '@/hooks/useApi';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

export function LyricsPanel() {
  const track = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const { data, isLoading, isError } = useLyrics(track?.videoId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLParagraphElement>(null);

  const activeIndex = useMemo(() => {
    if (!data?.hasTimestamps || !data.lines.length) return -1;
    const ms = currentTime * 1000;
    let lo = 0;
    let hi = data.lines.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (data.lines[mid]!.startMs <= ms) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }, [currentTime, data]);

  useEffect(() => {
    if (activeIndex < 0 || !activeRef.current || !scrollRef.current) return;
    const el = activeRef.current;
    const container = scrollRef.current;
    const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: target, behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-md border border-white/[0.05] bg-surface-1/40 p-6 backdrop-blur-md">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
        Lyrics
        {data?.source && <span className="ml-2 normal-case tracking-normal">· {data.source}</span>}
      </p>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={cn('h-4', i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-1/2' : 'w-5/6')} />
          ))}
        </div>
      )}

      {!isLoading && (isError || !data || (!data.lyrics && data.lines.length === 0)) && (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-text-tertiary">
          가사를 찾을 수 없습니다.
        </div>
      )}

      {!isLoading && data?.hasTimestamps && data.lines.length > 0 && (
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2 text-center text-base leading-relaxed"
        >
          {data.lines.map((ln, i) => (
            <p
              key={i}
              ref={i === activeIndex ? activeRef : undefined}
              className={cn(
                'transition-all duration-300',
                i === activeIndex
                  ? 'scale-[1.02] font-semibold text-text-primary'
                  : i < activeIndex
                    ? 'text-text-tertiary/70'
                    : 'text-text-secondary',
              )}
            >
              {ln.text || '♪'}
            </p>
          ))}
        </div>
      )}

      {!isLoading && data && !data.hasTimestamps && data.lyrics && (
        <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-text-secondary">
          {data.lyrics.split('\n').map((line, i) => (
            <p key={i} className={cn('py-1', !line.trim() && 'h-3')}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
