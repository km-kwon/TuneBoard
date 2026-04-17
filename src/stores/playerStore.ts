import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Track, RepeatMode } from '@/types';
import {
  ytLoad,
  ytPlay,
  ytPause,
  ytSeek,
  ytSetVolume,
  ytMute,
  ytUnMute,
} from '@/lib/youtubeApi';
import { DUMMY_TRACKS } from '@/data/dummyTracks';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';

interface PlayerState {
  // YT readiness + state machine
  isReady: boolean;
  status: PlayerStatus;
  isPlaying: boolean;

  // Current track + transport
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  isScrubbing: boolean;

  // Audio
  volume: number;
  isMuted: boolean;

  // Queue
  queue: Track[];
  queueIndex: number;
  shuffleMode: boolean;
  repeatMode: RepeatMode;

  // Side state
  playHistory: Track[];
  likedIds: string[];
  nowPlayingOpen: boolean;

  // Public actions
  play: (track?: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (sec: number) => void;
  setScrubbing: (v: boolean) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (videoId: string) => void;

  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track, position?: 'next' | 'end') => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  toggleNowPlaying: () => void;

  // Internal — called by useYouTubePlayer event handlers
  _setReady: (r: boolean) => void;
  _setStatus: (s: PlayerStatus) => void;
  _setProgress: (time: number, duration: number) => void;
}

const HISTORY_MAX = 100;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      isReady: false,
      status: 'idle',
      isPlaying: false,

      currentTrack: DUMMY_TRACKS[0] ?? null,
      currentTime: 0,
      duration: DUMMY_TRACKS[0]?.durationSec ?? 0,
      isScrubbing: false,

      volume: 65,
      isMuted: false,

      queue: DUMMY_TRACKS,
      queueIndex: 0,
      shuffleMode: false,
      repeatMode: 'off',

      playHistory: [],
      likedIds: [],
      nowPlayingOpen: false,

      play: (track) => {
        const cur = get().currentTrack;
        const target = track ?? cur;
        if (!target) return;

        const isNewTrack = !cur || target.videoId !== cur.videoId;
        const isCold = get().status === 'idle';

        if (isNewTrack || isCold) {
          set((s) => ({
            currentTrack: target,
            currentTime: 0,
            duration: target.durationSec,
            status: 'loading',
            playHistory: [target, ...s.playHistory.filter((t) => t.videoId !== target.videoId)].slice(
              0,
              HISTORY_MAX,
            ),
          }));
          ytLoad(target.videoId, 0);
        } else {
          ytPlay();
        }
      },

      pause: () => {
        ytPause();
      },

      togglePlay: () => {
        if (get().isPlaying) get().pause();
        else get().play();
      },

      next: () => {
        const { queue, queueIndex, repeatMode, shuffleMode } = get();
        if (queue.length === 0) return;

        if (repeatMode === 'one') {
          const t = queue[queueIndex];
          if (t) {
            ytSeek(0);
            ytPlay();
          }
          return;
        }

        let nextIdx: number;
        if (shuffleMode && queue.length > 1) {
          do {
            nextIdx = Math.floor(Math.random() * queue.length);
          } while (nextIdx === queueIndex);
        } else {
          nextIdx = queueIndex + 1;
          if (nextIdx >= queue.length) {
            if (repeatMode === 'all') {
              nextIdx = 0;
            } else {
              ytPause();
              return;
            }
          }
        }

        const target = queue[nextIdx];
        if (target) {
          set({ queueIndex: nextIdx });
          get().play(target);
        }
      },

      previous: () => {
        const { queue, queueIndex, currentTime } = get();
        if (queue.length === 0) return;

        // Restart current if more than 3s in.
        if (currentTime > 3) {
          get().seek(0);
          return;
        }

        let prevIdx = queueIndex - 1;
        if (prevIdx < 0) prevIdx = queue.length - 1;

        const target = queue[prevIdx];
        if (target) {
          set({ queueIndex: prevIdx });
          get().play(target);
        }
      },

      seek: (sec) => {
        const clamped = Math.max(0, Math.min(get().duration || sec, sec));
        ytSeek(clamped);
        set({ currentTime: clamped });
      },

      setScrubbing: (v) => set({ isScrubbing: v }),

      setVolume: (v) => {
        const clamped = Math.max(0, Math.min(100, v));
        ytSetVolume(clamped);
        if (clamped === 0) {
          ytMute();
          set({ volume: clamped, isMuted: true });
        } else {
          if (get().isMuted) ytUnMute();
          set({ volume: clamped, isMuted: false });
        }
      },

      toggleMute: () => {
        if (get().isMuted) {
          ytUnMute();
          set({ isMuted: false });
        } else {
          ytMute();
          set({ isMuted: true });
        }
      },

      toggleShuffle: () => set((s) => ({ shuffleMode: !s.shuffleMode })),

      toggleRepeat: () =>
        set((s) => ({
          repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
        })),

      toggleLike: (videoId) =>
        set((s) => ({
          likedIds: s.likedIds.includes(videoId)
            ? s.likedIds.filter((id) => id !== videoId)
            : [...s.likedIds, videoId],
        })),

      setQueue: (tracks, startIndex = 0) => {
        if (tracks.length === 0) return;
        const idx = Math.max(0, Math.min(tracks.length - 1, startIndex));
        const target = tracks[idx];
        set({ queue: tracks, queueIndex: idx });
        if (target) get().play(target);
      },

      addToQueue: (track, position = 'end') => {
        set((s) => {
          if (position === 'next') {
            const before = s.queue.slice(0, s.queueIndex + 1);
            const after = s.queue.slice(s.queueIndex + 1);
            return { queue: [...before, track, ...after] };
          }
          return { queue: [...s.queue, track] };
        });
      },

      removeFromQueue: (index) => {
        set((s) => {
          if (index < 0 || index >= s.queue.length) return s;
          const next = s.queue.filter((_, i) => i !== index);
          let nextIdx = s.queueIndex;
          if (index < s.queueIndex) nextIdx = s.queueIndex - 1;
          else if (index === s.queueIndex) nextIdx = Math.min(s.queueIndex, next.length - 1);
          return { queue: next, queueIndex: Math.max(0, nextIdx) };
        });
      },

      clearQueue: () => set({ queue: [], queueIndex: 0 }),

      openNowPlaying: () => set({ nowPlayingOpen: true }),
      closeNowPlaying: () => set({ nowPlayingOpen: false }),
      toggleNowPlaying: () => set((s) => ({ nowPlayingOpen: !s.nowPlayingOpen })),

      _setReady: (r) => set({ isReady: r }),
      _setStatus: (s) =>
        set({
          status: s,
          isPlaying: s === 'playing',
        }),
      _setProgress: (time, duration) =>
        set((s) => ({
          currentTime: s.isScrubbing ? s.currentTime : time,
          duration: duration > 0 ? duration : s.duration,
        })),
    }),
    {
      name: 'tuneboard.player',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        volume: s.volume,
        isMuted: s.isMuted,
        shuffleMode: s.shuffleMode,
        repeatMode: s.repeatMode,
        likedIds: s.likedIds,
      }),
    },
  ),
);
