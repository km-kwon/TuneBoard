import { motion } from 'framer-motion';
import { Search, Music2, Play, ListPlus, ListEnd } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearch } from '@/hooks/useApi';
import { useDebounced } from '@/hooks/useDebounced';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { usePlayerStore } from '@/stores/playerStore';
import { useSearchStore } from '@/stores/searchStore';
import { Skeleton } from '@/components/common/Skeleton';
import { ContextMenuPortal, type ContextMenuItem } from '@/components/common/ContextMenu';
import { formatTime, cn } from '@/lib/utils';
import type {
  AlbumSummary,
  ArtistSummary,
  PlaylistSummary,
  SearchFilter,
  SearchResults,
  Track,
} from '@/types';

const TABS: { key: SearchFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'songs', label: 'Songs' },
  { key: 'videos', label: 'Videos' },
  { key: 'albums', label: 'Albums' },
  { key: 'artists', label: 'Artists' },
];

export function SearchPage() {
  const query = useSearchStore((s) => s.query);
  const filter = useSearchStore((s) => s.filter);
  const setFilter = useSearchStore((s) => s.setFilter);
  const { push: pushRecent } = useRecentSearches();

  const debounced = useDebounced(query, 300);
  const { data, isFetching, isError } = useSearch(debounced, filter);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length >= 2) pushRecent(q);
  }, [debounced, pushRecent]);

  return (
    <div className="h-full overflow-y-auto px-10 pb-32 pt-8">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
        Search
      </p>
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight">
        {query ? (
          <>
            Results for <span className="text-gradient-accent">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          'What do you want to hear?'
        )}
      </h1>

      {!query && <EmptyState />}

      {query && (
        <>
          <div className="sticky top-0 z-[5] -mx-10 mb-6 border-b border-white/[0.04] bg-surface-0/80 px-10 py-2 backdrop-blur-md">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    filter === tab.key
                      ? 'bg-accent text-text-onAccent'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isFetching && <SearchSkeleton />}
          {isError && (
            <div className="rounded-md border border-white/[0.06] bg-surface-2/60 p-6 text-sm text-text-secondary">
              Search failed. Is the backend running on port 8000?
            </div>
          )}
          {!isFetching && !isError && data && (
            <Results data={data} filter={filter} />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  const { items, remove, clear } = useRecentSearches();
  const setQuery = useSearchStore((s) => s.setQuery);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.06] py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 ring-1 ring-white/[0.06]">
          <Search className="h-6 w-6 text-text-tertiary" />
        </div>
        <p className="text-sm text-text-secondary">
          Start typing above to search songs, videos, artists, and albums.
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Tip: press{' '}
          <kbd className="rounded-xs border border-white/[0.06] bg-surface-3 px-1.5 py-0.5 font-mono text-[10px]">
            ⌘ K
          </kbd>{' '}
          from anywhere.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Recent searches</h2>
        <button
          onClick={clear}
          className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((q) => (
          <div
            key={q}
            className="group flex items-center gap-1 rounded-full border border-white/[0.06] bg-surface-2 pl-3 pr-1 text-sm"
          >
            <button
              onClick={() => setQuery(q)}
              className="py-1.5 pr-2 text-text-primary hover:text-accent"
            >
              {q}
            </button>
            <button
              onClick={() => remove(q)}
              className="flex h-5 w-5 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
              aria-label={`Remove ${q}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-sm p-2">
              <Skeleton className="h-12 w-12 rounded-xs" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2 w-1/3" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-sm" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Results({ data, filter }: { data: SearchResults; filter: SearchFilter }) {
  const showSongs = (filter === 'all' || filter === 'songs') && data.songs.length > 0;
  const showVideos = (filter === 'all' || filter === 'videos') && data.videos.length > 0;
  const showAlbums = (filter === 'all' || filter === 'albums') && data.albums.length > 0;
  const showArtists = (filter === 'all' || filter === 'artists') && data.artists.length > 0;

  const nothing = !showSongs && !showVideos && !showAlbums && !showArtists;

  if (nothing) {
    return (
      <div className="rounded-md border border-white/[0.06] bg-surface-2/40 px-6 py-10 text-center text-sm text-text-secondary">
        No results. Try different keywords.
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
      className="flex flex-col gap-10"
    >
      {showSongs && <SongResults songs={data.songs} videos={data.videos} />}
      {showVideos && <VideoResults videos={data.videos} />}
      {showAlbums && <AlbumResults albums={data.albums} />}
      {showArtists && <ArtistResults artists={data.artists} />}
      {filter === 'all' && data.playlists.length > 0 && (
        <PlaylistResults playlists={data.playlists} />
      )}
    </motion.div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.19, 1, 0.22, 1] } },
};

function SongResults({ songs, videos }: { songs: Track[]; videos: Track[] }) {
  const setQueue = usePlayerStore((s) => s.setQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const openMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          key: 'play',
          label: 'Play',
          icon: Play,
          onSelect: () => {
            const idx = songs.findIndex((s) => s.videoId === track.videoId);
            setQueue([...songs, ...videos], Math.max(0, idx));
          },
        },
        { key: 'play-next', label: 'Play next', icon: ListPlus, onSelect: () => addToQueue(track, 'next') },
        { key: 'add-queue', label: 'Add to queue', icon: ListEnd, onSelect: () => addToQueue(track, 'end') },
      ],
    });
  };

  return (
    <motion.section variants={sectionVariants}>
      <h2 className="mb-4 font-display text-xl font-semibold">Songs</h2>
      <div className="flex flex-col">
        {songs.slice(0, 8).map((track, i) => (
          <div
            key={track.videoId}
            onContextMenu={(e) => openMenu(e, track)}
            onDoubleClick={() => setQueue([...songs, ...videos], i)}
            className={cn(
              'group flex items-center gap-3 rounded-sm p-2 transition-colors duration-150 ease-out-quart',
              currentTrack?.videoId === track.videoId ? 'bg-accent/10' : 'hover:bg-surface-2',
            )}
          >
            <button
              onClick={() => setQueue([...songs, ...videos], i)}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs bg-surface-3"
              aria-label={`Play ${track.title}`}
            >
              {track.thumbnailUrl ? (
                <img src={track.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music2 className="h-4 w-4 text-text-tertiary" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Play
                  className={cn(
                    'h-4 w-4 text-text-primary',
                    isPlaying && currentTrack?.videoId === track.videoId && 'animate-pulse',
                  )}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm font-medium',
                  currentTrack?.videoId === track.videoId ? 'text-accent' : 'text-text-primary',
                )}
              >
                {track.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {track.artists.map((a) => a.name).join(', ')}
                {track.album ? ` · ${track.album.name}` : ''}
              </p>
            </div>
            <button
              onClick={() => addToQueue(track, 'end')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-3 hover:text-text-primary"
              aria-label="Add to queue"
              title="Add to queue"
            >
              <ListEnd className="h-4 w-4" />
            </button>
            <span className="font-mono text-[11px] tabular-nums text-text-tertiary">
              {formatTime(track.durationSec)}
            </span>
          </div>
        ))}
      </div>

      <ContextMenuPortal
        open={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menu?.items ?? []}
        onClose={() => setMenu(null)}
      />
    </motion.section>
  );
}

function VideoResults({ videos }: { videos: Track[] }) {
  const setQueue = usePlayerStore((s) => s.setQueue);
  return (
    <motion.section variants={sectionVariants}>
      <h2 className="mb-4 font-display text-xl font-semibold">Videos</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.slice(0, 6).map((v, i) => (
          <button
            key={v.videoId}
            onClick={() => setQueue(videos, i)}
            className="group flex gap-3 rounded-md bg-surface-2/60 p-3 text-left transition-colors hover:bg-surface-3"
          >
            <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-sm bg-surface-3">
              {v.thumbnailUrl && (
                <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute bottom-1 right-1 rounded-xs bg-black/70 px-1 py-0.5 font-mono text-[10px]">
                {formatTime(v.durationSec)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-accent">
                {v.title}
              </p>
              <p className="mt-1 truncate text-xs text-text-tertiary">
                {v.artists.map((a) => a.name).join(', ')}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function AlbumResults({ albums }: { albums: AlbumSummary[] }) {
  return (
    <motion.section variants={sectionVariants}>
      <h2 className="mb-4 font-display text-xl font-semibold">Albums</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {albums.slice(0, 12).map((a, i) => (
          <button
            key={(a.browseId || a.title) + i}
            className="group flex flex-col rounded-md bg-surface-2/60 p-3 text-left transition-all hover:bg-surface-3"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-surface-3 shadow-1">
              {a.thumbnailUrl && (
                <img
                  src={a.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <p className="mt-3 truncate text-sm font-semibold leading-tight">{a.title}</p>
            <p className="mt-1 truncate text-xs text-text-tertiary">
              {a.year && `${a.year} · `}
              {a.artists.map((ar) => ar.name).join(', ')}
            </p>
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function ArtistResults({ artists }: { artists: ArtistSummary[] }) {
  return (
    <motion.section variants={sectionVariants}>
      <h2 className="mb-4 font-display text-xl font-semibold">Artists</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {artists.slice(0, 12).map((a, i) => (
          <button
            key={(a.browseId || a.name) + i}
            className="group flex flex-col items-center rounded-md p-3 text-center transition-colors hover:bg-surface-2/60"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-full bg-surface-3 shadow-1">
              {a.thumbnailUrl && (
                <img
                  src={a.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <p className="mt-3 truncate text-sm font-semibold">{a.name}</p>
            <p className="mt-1 text-xs text-text-tertiary">Artist</p>
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function PlaylistResults({ playlists }: { playlists: PlaylistSummary[] }) {
  return (
    <motion.section variants={sectionVariants}>
      <h2 className="mb-4 font-display text-xl font-semibold">Playlists</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {playlists.slice(0, 12).map((p) => (
          <button
            key={p.id}
            className="group flex flex-col rounded-md bg-surface-2/60 p-3 text-left transition-all hover:bg-surface-3"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-surface-3 shadow-1">
              {p.thumbnailUrl && (
                <img src={p.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="mt-3 truncate text-sm font-semibold">{p.title}</p>
            <p className="mt-1 truncate text-xs text-text-tertiary">
              {p.description || 'Playlist'}
            </p>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
