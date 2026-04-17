import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Track } from '@/types';

export interface PlayEvent {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  timestamp: number;
  durationSec: number;
  listenedSec: number;
}

interface StatsState {
  events: PlayEvent[];
  logPlay: (track: Track, listenedSec?: number) => void;
  extendLastListened: (trackId: string, listenedSec: number) => void;
  clear: () => void;
  seedDemo: () => void;
}

const MAX = 2000;

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      events: [],
      logPlay: (track, listenedSec = 0) => {
        const ev: PlayEvent = {
          trackId: track.videoId,
          title: track.title,
          artist: track.artists.map((a) => a.name).join(', '),
          thumbnailUrl: track.thumbnailUrl,
          timestamp: Date.now(),
          durationSec: track.durationSec,
          listenedSec,
        };
        set((s) => ({ events: [ev, ...s.events].slice(0, MAX) }));
      },
      extendLastListened: (trackId, listenedSec) => {
        set((s) => {
          const idx = s.events.findIndex((e) => e.trackId === trackId);
          if (idx === -1) return s;
          const copy = s.events.slice();
          copy[idx] = { ...copy[idx], listenedSec };
          return { events: copy };
        });
      },
      clear: () => set({ events: [] }),
      seedDemo: () => {
        if (get().events.length > 0) return;
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const artists = [
          { name: 'Rick Astley', title: 'Never Gonna Give You Up', thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', id: 'dQw4w9WgXcQ', dur: 213 },
          { name: 'Queen', title: 'Bohemian Rhapsody', thumb: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', id: 'fJ9rUzIMcZQ', dur: 354 },
          { name: 'Ed Sheeran', title: 'Shape of You', thumb: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', id: 'JGwWNGJdvx8', dur: 263 },
          { name: 'Alan Walker', title: 'Faded', thumb: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg', id: '60ItHLz5WEA', dur: 212 },
          { name: 'OneRepublic', title: 'Counting Stars', thumb: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg', id: 'hT_nvWreIhg', dur: 257 },
          { name: 'Luis Fonsi, Daddy Yankee', title: 'Despacito', thumb: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', id: 'kJQP7kiw5Fk', dur: 281 },
          { name: 'Mark Ronson, Bruno Mars', title: 'Uptown Funk', thumb: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg', id: 'OPf0YbXqDm0', dur: 269 },
          { name: 'PSY', title: 'Gangnam Style', thumb: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', id: '9bZkp7q19f0', dur: 253 },
        ];
        const events: PlayEvent[] = [];
        let seed = 17;
        const rand = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
        for (let d = 29; d >= 0; d--) {
          const plays = 4 + Math.floor(rand() * 14);
          for (let i = 0; i < plays; i++) {
            const a = artists[Math.floor(rand() * artists.length)];
            if (!a) continue;
            const hour = Math.floor(rand() * 24);
            const minute = Math.floor(rand() * 60);
            const ts = now - d * day;
            const date = new Date(ts);
            date.setHours(hour, minute, 0, 0);
            events.push({
              trackId: a.id,
              title: a.title,
              artist: a.name,
              thumbnailUrl: a.thumb,
              timestamp: date.getTime(),
              durationSec: a.dur,
              listenedSec: Math.floor(a.dur * (0.4 + rand() * 0.6)),
            });
          }
        }
        events.sort((x, y) => y.timestamp - x.timestamp);
        set({ events: events.slice(0, MAX) });
      },
    }),
    {
      name: 'tuneboard.stats',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
