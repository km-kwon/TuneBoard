import type { PlayEvent } from '@/stores/statsStore';

export interface ArtistStat {
  name: string;
  count: number;
  seconds: number;
  thumbnailUrl: string;
}
export interface TrackStat {
  trackId: string;
  title: string;
  artist: string;
  count: number;
  seconds: number;
  thumbnailUrl: string;
}

const MS_DAY = 24 * 60 * 60 * 1000;

export function filterByRange(events: PlayEvent[], range: 'today' | 'week' | 'month'): PlayEvent[] {
  const now = Date.now();
  const start = new Date();
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    start.setTime(now - 7 * MS_DAY);
  } else {
    start.setTime(now - 30 * MS_DAY);
  }
  const cutoff = start.getTime();
  return events.filter((e) => e.timestamp >= cutoff);
}

export function totalSeconds(events: PlayEvent[]): number {
  return events.reduce((acc, e) => acc + (e.listenedSec || 0), 0);
}

export function topArtists(events: PlayEvent[], limit = 5): ArtistStat[] {
  const m = new Map<string, ArtistStat>();
  for (const e of events) {
    const prev = m.get(e.artist) ?? {
      name: e.artist,
      count: 0,
      seconds: 0,
      thumbnailUrl: e.thumbnailUrl,
    };
    prev.count += 1;
    prev.seconds += e.listenedSec || 0;
    m.set(e.artist, prev);
  }
  return Array.from(m.values())
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

export function topTracks(events: PlayEvent[], limit = 10): TrackStat[] {
  const m = new Map<string, TrackStat>();
  for (const e of events) {
    const prev = m.get(e.trackId) ?? {
      trackId: e.trackId,
      title: e.title,
      artist: e.artist,
      count: 0,
      seconds: 0,
      thumbnailUrl: e.thumbnailUrl,
    };
    prev.count += 1;
    prev.seconds += e.listenedSec || 0;
    m.set(e.trackId, prev);
  }
  return Array.from(m.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Naïve genre mapping keyed by known artist names — real impl would use MusicBrainz.
 * Keeps the radar chart meaningful for the demo data.
 */
const GENRE_MAP: Record<string, string> = {
  'Rick Astley': 'Pop',
  Queen: 'Rock',
  'Ed Sheeran': 'Pop',
  'Alan Walker': 'Electronic',
  OneRepublic: 'Pop',
  'Luis Fonsi, Daddy Yankee': 'Latin',
  'Mark Ronson, Bruno Mars': 'Funk',
  PSY: 'K-Pop',
};

export const GENRES = ['Pop', 'Rock', 'Electronic', 'Latin', 'Funk', 'K-Pop', 'Hip-Hop'] as const;

export function genreDistribution(events: PlayEvent[]): { genre: string; value: number }[] {
  const counts: Record<string, number> = Object.fromEntries(GENRES.map((g) => [g, 0]));
  for (const e of events) {
    const g = GENRE_MAP[e.artist] ?? 'Pop';
    counts[g] = (counts[g] ?? 0) + 1;
  }
  return GENRES.map((g) => ({ genre: g, value: counts[g] ?? 0 }));
}

/** 7 days (rows) x 24 hours (cols) heatmap of play counts. */
export function hourDayHeatmap(events: PlayEvent[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const e of events) {
    const d = new Date(e.timestamp);
    const row = (d.getDay() + 6) % 7; // Monday first
    const col = d.getHours();
    (grid[row] ?? [])[col] = ((grid[row] ?? [])[col] ?? 0) + 1;
  }
  return grid;
}

export function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
