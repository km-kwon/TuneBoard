import type {
  HomeSection,
  Lyrics,
  PlaylistDetail,
  PlaylistSummary,
  SearchFilter,
  SearchResults,
  Track,
} from '@/types';

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ ok: boolean; authed: boolean }>('/health'),

  listPlaylists: () => request<PlaylistSummary[]>('/playlists'),
  getPlaylist: (id: string) =>
    request<PlaylistDetail>(`/playlists/${encodeURIComponent(id)}`),
  getLiked: () => request<PlaylistDetail>('/liked'),

  search: (q: string, filter: SearchFilter = 'all') =>
    request<SearchResults>(
      `/search?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}`,
    ),
  searchSuggestions: (q: string) =>
    request<string[]>(`/search/suggestions?q=${encodeURIComponent(q)}`),

  getHome: () => request<HomeSection[]>('/home'),

  getTrackInfo: (videoId: string) =>
    request<Track & { viewCount?: string; shortDescription?: string }>(
      `/track/${encodeURIComponent(videoId)}/info`,
    ),
  getLyrics: (videoId: string) =>
    request<Lyrics>(`/lyrics/${encodeURIComponent(videoId)}`),

  getRelated: (videoId: string) =>
    request<Track[]>(`/related/${encodeURIComponent(videoId)}`),

  queueAdd: (videoId: string, source?: string) =>
    request<{ ok: boolean; videoId: string }>('/queue/add', {
      method: 'POST',
      body: JSON.stringify({ videoId, source }),
    }),
};
