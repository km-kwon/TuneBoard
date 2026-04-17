import { motion } from 'framer-motion';
import { Play, Music2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHome } from '@/hooks/useApi';
import { usePlayerStore } from '@/stores/playerStore';
import { Skeleton } from '@/components/common/Skeleton';
import { DUMMY_TRACKS } from '@/data/dummyTracks';
import { formatTime, cn } from '@/lib/utils';
import type {
  AlbumSummary,
  ArtistSummary,
  HomeItem,
  HomeSection,
  PlaylistSummary,
  Track,
} from '@/types';

export function HomePage() {
  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? 'Up late'
      : hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';

  const { data, isLoading, isError } = useHome();

  return (
    <div className="h-full overflow-y-auto px-10 pb-32 pt-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
        className="mb-10"
      >
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Today
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
          {greeting}, <span className="text-gradient-accent">listener</span>.
        </h1>
        <p className="mt-3 max-w-md text-sm text-text-secondary">
          Pick up where you left off, or jump into something fresh.
        </p>
      </motion.header>

      {isLoading && <HomeSkeleton />}

      {isError && <HomeFallback />}

      {!isLoading &&
        !isError &&
        data?.map((section, i) => <SectionView key={section.title + i} section={section} index={i} />)}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {Array.from({ length: 3 }).map((_, s) => (
        <section key={s}>
          <Skeleton className="mb-4 h-5 w-48" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-square w-full rounded-sm" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HomeFallback() {
  const setQueue = usePlayerStore((s) => s.setQueue);
  return (
    <div>
      <div className="mb-8 flex items-start gap-3 rounded-md border border-white/[0.06] bg-surface-2/50 p-4 text-sm">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-hot" />
        <div>
          <p className="font-medium text-text-primary">Backend unavailable</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Start the FastAPI server on port 8000 to load real recommendations. Showing local
            fixtures below.
          </p>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">Quick play</h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {DUMMY_TRACKS.slice(0, 6).map((track, i) => (
          <TrackRowCompact key={track.videoId} track={track} onPlay={() => setQueue(DUMMY_TRACKS, i)} />
        ))}
      </div>
    </div>
  );
}

function SectionView({ section, index }: { section: HomeSection; index: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.05, 0.2),
        ease: [0.19, 1, 0.22, 1],
      }}
      className="mb-10"
    >
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">{section.title}</h2>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.035 } },
        }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5"
      >
        {section.items.slice(0, 10).map((item, i) => (
          <HomeItemCard key={itemKey(item, i)} item={item} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function itemKey(item: HomeItem, i: number): string {
  if (item.kind === 'track') return `t-${item.data.videoId}`;
  if (item.kind === 'playlist') return `p-${item.data.id}`;
  if (item.kind === 'album') return `a-${item.data.browseId || i}`;
  if (item.kind === 'artist') return `ar-${item.data.browseId || i}`;
  return `x-${i}`;
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.19, 1, 0.22, 1] } },
};

function HomeItemCard({ item }: { item: HomeItem }) {
  if (item.kind === 'track') return <TrackCard track={item.data} />;
  if (item.kind === 'playlist') return <PlaylistCard playlist={item.data} />;
  if (item.kind === 'album') return <AlbumCard album={item.data} />;
  if (item.kind === 'artist') return <ArtistCard artist={item.data} />;
  return null;
}

function TrackCard({ track }: { track: Track }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const play = usePlayerStore((s) => s.play);
  const active = currentTrack?.videoId === track.videoId;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => play(track)}
      className="group flex flex-col rounded-md bg-surface-2/60 p-3 text-left transition-all duration-200 ease-out-quart hover:bg-surface-3 hover:shadow-glow-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-surface-3 shadow-1">
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 ease-out-quart group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 className="h-8 w-8 text-text-tertiary" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-accent text-text-onAccent opacity-0 shadow-glow-md transition-all duration-200 ease-out-quart group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
        </div>
      </div>
      <p
        className={cn(
          'mt-3 truncate text-sm font-semibold leading-tight',
          active && 'text-accent',
        )}
      >
        {track.title}
      </p>
      <p className="mt-1 truncate text-xs text-text-tertiary">
        {track.artists.map((a) => a.name).join(', ')}
      </p>
    </motion.button>
  );
}

function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const navigate = useNavigate();
  return (
    <motion.button
      variants={itemVariants}
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="group flex flex-col rounded-md bg-surface-2/60 p-3 text-left transition-all duration-200 ease-out-quart hover:bg-surface-3 hover:shadow-glow-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-surface-3 shadow-1">
        {playlist.thumbnailUrl ? (
          <img
            src={playlist.thumbnailUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 ease-out-quart group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gradient-accent">
            <span className="font-display text-5xl font-bold text-text-primary/25">
              {playlist.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <p className="mt-3 truncate font-display text-sm font-semibold leading-tight">{playlist.title}</p>
      <p className="mt-1 truncate text-xs text-text-tertiary">
        {playlist.description || (playlist.trackCount > 0 ? `${playlist.trackCount} tracks` : 'Playlist')}
      </p>
    </motion.button>
  );
}

function AlbumCard({ album }: { album: AlbumSummary }) {
  return (
    <motion.button
      variants={itemVariants}
      className="group flex flex-col rounded-md bg-surface-2/60 p-3 text-left transition-all duration-200 ease-out-quart hover:bg-surface-3 hover:shadow-glow-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-surface-3 shadow-1">
        {album.thumbnailUrl && (
          <img
            src={album.thumbnailUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 ease-out-quart group-hover:scale-[1.03]"
          />
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold leading-tight">{album.title}</p>
      <p className="mt-1 truncate text-xs text-text-tertiary">
        {album.type} · {album.artists.map((a) => a.name).join(', ')}
      </p>
    </motion.button>
  );
}

function ArtistCard({ artist }: { artist: ArtistSummary }) {
  return (
    <motion.button
      variants={itemVariants}
      className="group flex flex-col items-center rounded-md p-3 text-center transition-all duration-200 ease-out-quart hover:bg-surface-2/60"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full bg-surface-3 shadow-1">
        {artist.thumbnailUrl && (
          <img
            src={artist.thumbnailUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 ease-out-quart group-hover:scale-[1.03]"
          />
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold leading-tight">{artist.name}</p>
      <p className="mt-1 truncate text-xs text-text-tertiary">Artist</p>
    </motion.button>
  );
}

function TrackRowCompact({ track, onPlay }: { track: Track; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="group flex items-center gap-3 rounded-sm p-2 text-left transition-colors duration-150 ease-out-quart hover:bg-surface-2"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xs bg-surface-3">
        <img src={track.thumbnailUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {track.artists.map((a) => a.name).join(', ')}
        </p>
      </div>
      <span className="font-mono text-[11px] tabular-nums text-text-tertiary">
        {formatTime(track.durationSec)}
      </span>
    </button>
  );
}
