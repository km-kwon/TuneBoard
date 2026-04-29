import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchFilter } from '@/types';

const ONE_MIN = 60 * 1000;
const FIVE_MIN = 5 * ONE_MIN;

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    staleTime: ONE_MIN,
    retry: false,
  });
}

export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth-status'],
    queryFn: api.getAuthStatus,
    staleTime: ONE_MIN,
    retry: false,
  });
}

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: api.listPlaylists,
    staleTime: FIVE_MIN,
    retry: 1,
  });
}

export function usePlaylist(id: string | undefined) {
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () => (id === 'liked' ? api.getLiked() : api.getPlaylist(id!)),
    enabled: !!id,
    staleTime: FIVE_MIN,
  });
}

export function useSearch(q: string, filter: SearchFilter = 'all') {
  return useQuery({
    queryKey: ['search', q, filter],
    queryFn: () => api.search(q, filter),
    enabled: q.trim().length > 0,
    staleTime: ONE_MIN,
  });
}

export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ['search-suggestions', q],
    queryFn: () => api.searchSuggestions(q),
    enabled: q.trim().length > 0,
    staleTime: ONE_MIN,
  });
}

export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: api.getHome,
    staleTime: FIVE_MIN,
  });
}

export function useLyrics(videoId: string | null | undefined) {
  return useQuery({
    queryKey: ['lyrics', videoId],
    queryFn: () => api.getLyrics(videoId!),
    enabled: !!videoId,
    staleTime: FIVE_MIN,
    retry: false,
  });
}

export function useRelated(videoId: string | null | undefined) {
  return useQuery({
    queryKey: ['related', videoId],
    queryFn: () => api.getRelated(videoId!),
    enabled: !!videoId,
    staleTime: FIVE_MIN,
    retry: 1,
  });
}

export function useTrackInfo(videoId: string | null | undefined) {
  return useQuery({
    queryKey: ['track-info', videoId],
    queryFn: () => api.getTrackInfo(videoId!),
    enabled: !!videoId,
    staleTime: FIVE_MIN,
  });
}
