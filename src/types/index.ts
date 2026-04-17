export type RepeatMode = 'off' | 'all' | 'one';
export type AppMode = 'music' | 'video';
export type ThemeName = 'amber' | 'cyan' | 'monochrome';

export interface Track {
  videoId: string;
  title: string;
  artists: { id: string; name: string }[];
  album?: { id: string; name: string } | null;
  durationSec: number;
  thumbnailUrl: string;
  isVideo?: boolean;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  thumbnailUrl?: string;
  trackCount: number;
  description?: string;
  pinned?: boolean;
}

export interface PlaylistDetail {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  trackCount: number;
  durationSec: number;
  author: string;
  year: string;
  tracks: Track[];
}

export interface AlbumSummary {
  browseId: string;
  title: string;
  artists: { id: string; name: string }[];
  year: string;
  thumbnailUrl: string;
  type: string;
}

export interface ArtistSummary {
  browseId: string;
  name: string;
  thumbnailUrl: string;
  subscribers: string;
}

export interface SearchResults {
  songs: Track[];
  videos: Track[];
  albums: AlbumSummary[];
  artists: ArtistSummary[];
  playlists: PlaylistSummary[];
}

export type SearchFilter = 'all' | 'songs' | 'videos' | 'albums' | 'artists';

export type HomeItem =
  | { kind: 'track'; data: Track }
  | { kind: 'playlist'; data: PlaylistSummary }
  | { kind: 'album'; data: AlbumSummary }
  | { kind: 'artist'; data: ArtistSummary };

export interface HomeSection {
  title: string;
  items: HomeItem[];
}

export interface LyricsLine {
  startMs: number;
  text: string;
}

export interface Lyrics {
  lyrics: string;
  source: string;
  hasTimestamps: boolean;
  lines: LyricsLine[];
}
