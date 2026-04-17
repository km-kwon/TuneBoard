import { motion } from 'framer-motion';
import { Eye, Heart, ListEnd, Music2, Share2, ThumbsUp } from 'lucide-react';
import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { useRelated, useTrackInfo } from '@/hooks/useApi';
import { Skeleton } from '@/components/common/Skeleton';
import { VideoStage } from '@/components/layout/VideoStage';
import { cn, formatTime } from '@/lib/utils';
import type { Track } from '@/types';

function formatViewCount(raw: string | undefined): string {
  if (!raw) return '';
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  return `${n} views`;
}

export function VideoPage() {
  const track = usePlayerStore((s) => s.currentTrack);
  const setMode = useUIStore((s) => s.setMode);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const liked = usePlayerStore((s) =>
    track ? s.likedIds.includes(track.videoId) : false,
  );
  const toggleLike = usePlayerStore((s) => s.toggleLike);

  // Visiting /video means the user wants to watch — switch into video mode.
  useEffect(() => {
    setMode('video');
  }, [setMode]);

  const videoId = track?.videoId;
  const { data: info } = useTrackInfo(videoId);
  const { data: related, isLoading: relatedLoading } = useRelated(videoId);

  return (
    <div className="h-full overflow-y-auto px-3 pb-32 pt-4 md:px-8 md:pt-6">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col">
          <VideoStage />

          <motion.div
            key={videoId ?? 'empty'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
            className="mt-5"
          >
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight">
              {track?.title ?? 'Pick a video to start'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <p className="text-sm text-text-secondary">
                {track?.artists.map((a) => a.name).join(', ') ?? '—'}
              </p>
              {info?.viewCount && (
                <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Eye className="h-3.5 w-3.5" />
                  {formatViewCount(info.viewCount)}
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => track && toggleLike(track.videoId)}
                disabled={!track}
                className={cn(
                  'flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm transition-colors hover:bg-surface-3',
                  liked && 'text-accent',
                )}
              >
                <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
                Like
              </button>
              <button className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm transition-colors hover:bg-surface-3">
                <ThumbsUp className="h-4 w-4" />
                Recommend
              </button>
              <button className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm transition-colors hover:bg-surface-3">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {info?.shortDescription && (
              <div className="mt-6 whitespace-pre-line rounded-md bg-surface-1/60 p-4 text-sm leading-relaxed text-text-secondary">
                {info.shortDescription}
              </div>
            )}
          </motion.div>
        </div>

        <aside className="flex min-w-0 flex-col">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
            Up next
          </p>
          {relatedLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-2 rounded-md p-2">
                  <Skeleton className="aspect-video w-32 shrink-0 rounded-xs" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!relatedLoading && (related?.length ?? 0) === 0 && (
            <p className="rounded-md bg-surface-1/60 p-4 text-xs text-text-tertiary">
              No related videos available.
            </p>
          )}
          {!relatedLoading && related && related.length > 0 && (
            <div className="flex flex-col gap-1">
              {related.map((rel, i) => (
                <RelatedRow
                  key={rel.videoId}
                  track={rel}
                  active={rel.videoId === videoId}
                  onPlay={() => setQueue(related, i)}
                  onAdd={() => addToQueue(rel, 'end')}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

interface RelatedRowProps {
  track: Track;
  active: boolean;
  onPlay: () => void;
  onAdd: () => void;
}

function RelatedRow({ track, active, onPlay, onAdd }: RelatedRowProps) {
  return (
    <div
      className={cn(
        'group flex cursor-pointer gap-2 rounded-md p-2 transition-colors',
        active ? 'bg-accent/10' : 'hover:bg-surface-2',
      )}
      onClick={onPlay}
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xs bg-surface-3">
        {track.thumbnailUrl ? (
          <img src={track.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 className="h-4 w-4 text-text-tertiary" />
          </div>
        )}
        {track.durationSec > 0 && (
          <div className="absolute bottom-1 right-1 rounded-xs bg-black/75 px-1 py-0.5 font-mono text-[10px]">
            {formatTime(track.durationSec)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p
          className={cn(
            'line-clamp-2 text-xs font-medium leading-snug',
            active ? 'text-accent' : 'text-text-primary',
          )}
        >
          {track.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-text-tertiary">
          {track.artists.map((a) => a.name).join(', ')}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-3 hover:text-text-primary"
        aria-label="Add to queue"
        title="Add to queue"
      >
        <ListEnd className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
