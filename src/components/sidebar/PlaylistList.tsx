import { NavLink } from 'react-router-dom';
import { Heart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaylists } from '@/hooks/useApi';
import { Skeleton } from '@/components/common/Skeleton';
import type { PlaylistSummary } from '@/types';

const PINNED: PlaylistSummary = {
  id: 'liked',
  title: 'Liked Songs',
  trackCount: 0,
  pinned: true,
};

interface PlaylistListProps {
  collapsed: boolean;
}

export function PlaylistList({ collapsed }: PlaylistListProps) {
  const { data, isLoading, isError, error } = usePlaylists();

  const authErr =
    isError && (error as { status?: number } | undefined)?.status === 401;

  const lists: PlaylistSummary[] = [PINNED, ...(data ?? [])];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
      <div className="flex flex-col gap-0.5">
        {lists.map((pl) => (
          <PlaylistItem key={pl.id} playlist={pl} collapsed={collapsed} />
        ))}

        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-12 items-center gap-3 px-2">
              <Skeleton className="h-9 w-9 shrink-0 rounded-xs" />
              {!collapsed && (
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/3" />
                </div>
              )}
            </div>
          ))}

        {isError && !collapsed && (
          <div
            className={cn(
              'mt-2 flex flex-col items-start gap-1 rounded-sm border border-white/[0.04] px-3 py-3 text-xs',
              authErr ? 'text-text-tertiary' : 'text-hot/80',
            )}
          >
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-medium">
                {authErr ? 'Not signed in' : 'Could not load'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-text-tertiary">
              {authErr
                ? 'Configure browser.json in the backend to see your library.'
                : 'Is the API running on port 8000?'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaylistItem({ playlist, collapsed }: { playlist: PlaylistSummary; collapsed: boolean }) {
  return (
    <NavLink
      to={`/playlist/${playlist.id}`}
      className={({ isActive }) =>
        cn(
          'group flex h-12 items-center gap-3 rounded-sm px-2 transition-colors duration-150 ease-out-quart',
          isActive
            ? 'bg-surface-2/80 text-text-primary'
            : 'text-text-secondary hover:bg-surface-2/60 hover:text-text-primary',
          collapsed && 'justify-center px-0',
        )
      }
      title={collapsed ? playlist.title : undefined}
    >
      <PlaylistThumb playlist={playlist} />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{playlist.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-text-tertiary">
            {playlist.pinned
              ? 'Playlist · Pinned'
              : playlist.trackCount > 0
                ? `${playlist.trackCount} tracks`
                : 'Playlist'}
          </p>
        </div>
      )}
    </NavLink>
  );
}

function PlaylistThumb({ playlist }: { playlist: PlaylistSummary }) {
  if (playlist.pinned) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xs gradient-accent shadow-glow-sm">
        <Heart className="h-4 w-4 fill-text-onAccent text-text-onAccent" strokeWidth={0} />
      </div>
    );
  }
  if (playlist.thumbnailUrl) {
    return (
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xs bg-surface-3 ring-1 ring-white/[0.04]">
        <img
          src={playlist.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xs bg-surface-3 ring-1 ring-white/[0.04]">
      <span className="font-display text-xs font-bold text-text-secondary">
        {playlist.title.charAt(0)}
      </span>
    </div>
  );
}
