import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Music2,
  ListPlus,
  ListEnd,
  Share2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { usePlaylist } from '@/hooks/useApi';
import { usePlayerStore } from '@/stores/playerStore';
import { extractDominantColor, type RGB } from '@/lib/colorExtract';
import { formatTime, cn } from '@/lib/utils';
import { Skeleton } from '@/components/common/Skeleton';
import { ContextMenuPortal, type ContextMenuItem } from '@/components/common/ContextMenu';
import type { PlaylistDetail, Track } from '@/types';

const FALLBACK: RGB = { r: 255, g: 159, b: 64 };

export function PlaylistPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = usePlaylist(id);

  const [color, setColor] = useState<RGB>(FALLBACK);
  const [scrolled, setScrolled] = useState(0); // 0..1
  const scrollerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    if (!data?.thumbnailUrl) {
      setColor(FALLBACK);
      return;
    }
    let cancelled = false;
    extractDominantColor(data.thumbnailUrl).then((c) => {
      if (!cancelled) setColor(c ?? FALLBACK);
    });
    return () => {
      cancelled = true;
    };
  }, [data?.thumbnailUrl]);

  if (isLoading) return <PlaylistSkeleton />;

  if (isError) {
    const status = (error as { status?: number } | undefined)?.status;
    return (
      <PlaylistError authRequired={status === 401} id={id ?? ''} />
    );
  }

  if (!data) return null;

  return (
    <PlaylistBody
      playlist={data}
      color={color}
      scrollProgress={scrolled}
      onScroll={(p) => setScrolled(p)}
      scrollerRef={scrollerRef}
    />
  );
}

function PlaylistBody({
  playlist,
  color,
  scrollProgress,
  onScroll,
}: {
  playlist: PlaylistDetail;
  color: RGB;
  scrollProgress: number;
  onScroll: (p: number) => void;
  scrollerRef: React.MutableRefObject<HTMLElement | Window | null>;
}) {
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const likedIds = usePlayerStore((s) => s.likedIds);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const tracks = playlist.tracks;
  const totalSec =
    playlist.durationSec ||
    tracks.reduce((sum, t) => sum + (t.durationSec || 0), 0);

  const isThisPlaying =
    isPlaying && tracks.some((t) => t.videoId === currentTrack?.videoId);

  const handlePlayPlaylist = () => {
    if (isThisPlaying) {
      togglePlay();
      return;
    }
    const currentIdx = tracks.findIndex((t) => t.videoId === currentTrack?.videoId);
    if (currentIdx >= 0) togglePlay();
    else if (tracks.length > 0) setQueue(tracks, 0);
  };

  const openMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    const items: ContextMenuItem[] = [
      {
        key: 'play',
        label: 'Play',
        icon: Play,
        onSelect: () => {
          const idx = tracks.findIndex((t) => t.videoId === track.videoId);
          if (idx >= 0) setQueue(tracks, idx);
        },
      },
      {
        key: 'play-next',
        label: 'Play next',
        icon: ListPlus,
        onSelect: () => addToQueue(track, 'next'),
      },
      {
        key: 'add-queue',
        label: 'Add to queue',
        icon: ListEnd,
        onSelect: () => addToQueue(track, 'end'),
      },
      { key: 'd1', label: '', onSelect: () => {}, divider: true },
      {
        key: 'like',
        label: likedIds.includes(track.videoId) ? 'Unlike' : 'Like',
        icon: Heart,
        onSelect: () => toggleLike(track.videoId),
      },
      {
        key: 'share',
        label: 'Share',
        icon: Share2,
        onSelect: () =>
          navigator.clipboard?.writeText(
            `https://music.youtube.com/watch?v=${track.videoId}`,
          ),
      },
      { key: 'd2', label: '', onSelect: () => {}, divider: true },
      {
        key: 'remove',
        label: 'Remove from playlist',
        icon: Trash2,
        danger: true,
        onSelect: () => {
          /* wiring in phase 4 */
        },
      },
    ];
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const cssRgb = `${color.r} ${color.g} ${color.b}`;
  const headerOpacity = Math.max(0, 1 - scrollProgress * 1.5);

  return (
    <div className="relative h-full">
      {/* Dominant-color wash that fades on scroll */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] transition-opacity duration-500"
        style={{
          opacity: headerOpacity,
          background: `linear-gradient(to bottom, rgb(${cssRgb} / 0.35) 0%, rgb(${cssRgb} / 0.1) 45%, transparent 100%)`,
        }}
      />

      {/* Sticky compact header */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-center gap-4 border-b border-white/[0.04] bg-surface-1/85 px-10 backdrop-blur-2xl transition-opacity duration-200',
          scrollProgress > 0.35 ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: `linear-gradient(to right, rgb(${cssRgb} / 0.25), rgb(var(--surface-1) / 0.9))` }}
      >
        <button
          onClick={handlePlayPlaylist}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full gradient-accent text-text-onAccent shadow-glow-sm"
          aria-label="Play"
        >
          {isThisPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
          )}
        </button>
        <p className="pointer-events-auto truncate font-display text-lg font-semibold">{playlist.title}</p>
      </div>

      <Virtuoso
        scrollerRef={(r) => {
          /* not used externally */
          void r;
        }}
        onScroll={(e) => {
          const el = e.currentTarget as HTMLElement;
          const p = Math.min(1, Math.max(0, el.scrollTop / 280));
          onScroll(p);
        }}
        style={{ height: '100%' }}
        className="playlist-scroller"
        totalCount={tracks.length}
        overscan={12}
        components={{
          Header: () => (
            <PlaylistHeader
              playlist={playlist}
              totalSec={totalSec}
              isPlaying={isThisPlaying}
              onPlay={handlePlayPlaylist}
            />
          ),
          Footer: () => <div className="h-32" />,
        }}
        itemContent={(index) => {
          const track = tracks[index];
          if (!track) return null;
          return (
            <div className="px-10">
              <TrackListRow
                index={index + 1}
                track={track}
                active={currentTrack?.videoId === track.videoId}
                isPlaying={isPlaying && currentTrack?.videoId === track.videoId}
                liked={likedIds.includes(track.videoId)}
                onPlay={() => setQueue(tracks, index)}
                onToggleLike={() => toggleLike(track.videoId)}
                onContextMenu={(e) => openMenu(e, track)}
              />
            </div>
          );
        }}
      />

      <ContextMenuPortal
        open={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menu?.items ?? []}
        onClose={() => setMenu(null)}
      />
    </div>
  );
}

function PlaylistHeader({
  playlist,
  totalSec,
  isPlaying,
  onPlay,
}: {
  playlist: PlaylistDetail;
  totalSec: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <header className="relative px-10 pb-6 pt-14">
      <div className="relative flex items-end gap-6">
        <div className="relative h-52 w-52 shrink-0 overflow-hidden rounded-md shadow-3">
          {playlist.thumbnailUrl ? (
            <img
              src={playlist.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundImage:
                  'linear-gradient(140deg, rgb(var(--accent-500)) 0%, rgb(var(--hot-500)) 100%)',
              }}
            >
              <span className="font-display text-8xl font-bold leading-none text-text-primary/25">
                {playlist.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        </div>

        <div className="min-w-0 flex-1 pb-2">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
            Playlist
          </p>
          <h1 className="mb-3 font-display text-6xl font-bold leading-none tracking-tight">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="mb-2 line-clamp-2 max-w-2xl text-sm text-text-secondary">
              {playlist.description}
            </p>
          )}
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{playlist.author || 'You'}</span>{' '}
            {playlist.year && <>· {playlist.year} </>}· {playlist.trackCount || playlist.tracks.length}{' '}
            tracks
            {totalSec > 0 && <> · {formatTime(totalSec)}</>}
          </p>
        </div>
      </div>

      <div className="relative mt-8 flex items-center gap-3">
        <button
          onClick={onPlay}
          className="flex h-12 w-12 items-center justify-center rounded-full gradient-accent text-text-onAccent shadow-glow-md transition-all duration-200 ease-out-quart hover:scale-105 hover:shadow-glow-lg"
          aria-label={isPlaying ? 'Pause playlist' : 'Play playlist'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="h-5 w-5 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
          )}
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-accent"
          aria-label="Like playlist"
        >
          <Heart className="h-5 w-5" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
          aria-label="More"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8 grid grid-cols-[24px_1fr_1fr_80px] gap-4 border-b border-white/[0.04] px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
        <span>#</span>
        <span>Title</span>
        <span>Album</span>
        <span className="text-right">Time</span>
      </div>
    </header>
  );
}

function TrackListRow({
  index,
  track,
  active,
  isPlaying,
  liked,
  onPlay,
  onToggleLike,
  onContextMenu,
}: {
  index: number;
  track: Track;
  active: boolean;
  isPlaying: boolean;
  liked: boolean;
  onPlay: () => void;
  onToggleLike: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onContextMenu={onContextMenu}
      onDoubleClick={onPlay}
      className={cn(
        'group grid grid-cols-[24px_1fr_1fr_80px] items-center gap-4 rounded-sm px-3 py-2 transition-colors duration-150 ease-out-quart',
        active ? 'bg-accent/10' : 'hover:bg-surface-2',
      )}
    >
      <button
        onClick={onPlay}
        className="flex h-6 w-6 items-center justify-center text-text-tertiary"
        aria-label={isPlaying ? 'Playing' : `Play ${track.title}`}
      >
        {active ? (
          <span className="flex h-4 items-end gap-[2px]">
            <span
              className={cn(
                'w-[2px] rounded-t-full bg-accent',
                isPlaying ? 'h-full animate-[pulse_1.2s_ease-in-out_infinite]' : 'h-1/2',
              )}
            />
            <span
              className={cn(
                'w-[2px] rounded-t-full bg-accent',
                isPlaying ? 'h-2/3 animate-[pulse_1.5s_ease-in-out_infinite]' : 'h-1/3',
              )}
            />
            <span
              className={cn(
                'w-[2px] rounded-t-full bg-accent',
                isPlaying ? 'h-3/4 animate-[pulse_0.9s_ease-in-out_infinite]' : 'h-2/5',
              )}
            />
          </span>
        ) : (
          <>
            <span className="font-mono text-xs tabular-nums group-hover:hidden">{index}</span>
            <Play
              className="hidden h-3.5 w-3.5 text-text-primary group-hover:block"
              fill="currentColor"
              strokeWidth={0}
            />
          </>
        )}
      </button>

      <button onClick={onPlay} className="flex min-w-0 items-center gap-3 text-left">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xs bg-surface-3">
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music2 className="h-4 w-4 text-text-tertiary" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-sm font-medium leading-tight',
              active ? 'text-accent' : 'text-text-primary',
            )}
          >
            {track.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
        </div>
      </button>

      <p className="min-w-0 truncate text-xs text-text-secondary">{track.album?.name ?? '—'}</p>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onToggleLike}
          className={cn(
            'transition-opacity',
            liked
              ? 'text-accent opacity-100'
              : 'text-text-tertiary opacity-0 hover:text-text-primary group-hover:opacity-100',
          )}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
        </button>
        <span className="font-mono text-[11px] tabular-nums text-text-tertiary">
          {formatTime(track.durationSec)}
        </span>
      </div>
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="h-full overflow-y-auto px-10 pb-32 pt-14">
      <div className="flex items-end gap-6">
        <Skeleton className="h-52 w-52 rounded-md" />
        <div className="flex flex-1 flex-col gap-3 pb-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[24px_1fr_1fr_80px] items-center gap-4 px-3 py-2">
            <Skeleton className="h-3 w-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xs" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-10 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaylistError({ authRequired, id }: { authRequired: boolean; id: string }) {
  return (
    <div className="flex h-full items-center justify-center px-10">
      <div className="flex max-w-md flex-col items-center rounded-md border border-white/[0.06] bg-surface-2/60 px-8 py-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-hot/10 text-hot">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-xl font-semibold">
          {authRequired ? 'Sign-in required' : 'Could not load playlist'}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {authRequired
            ? 'Set up ytmusicapi auth (browser.json) in the backend to access your library.'
            : `Failed to fetch playlist "${id}". Is the API server running?`}
        </p>
      </div>
    </div>
  );
}
