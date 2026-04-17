import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

/**
 * Wires the browser Media Session API to the player store so OS-level
 * surfaces (lockscreen, notification shade, Bluetooth headset buttons,
 * hardware media keys) stay in sync and can drive transport.
 *
 * Safe no-op when the API isn't available (older browsers).
 */
export function useMediaSession() {
  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => s.currentTime);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;

    if (!track) {
      ms.metadata = null;
      ms.playbackState = 'none';
      return;
    }

    ms.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album?.name ?? '',
      artwork: track.thumbnailUrl
        ? [
            { src: track.thumbnailUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: track.thumbnailUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: track.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });
  }, [track]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;

    const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch { /* unsupported action */ }
    };

    bind('play', () => usePlayerStore.getState().play());
    bind('pause', () => usePlayerStore.getState().pause());
    bind('previoustrack', () => usePlayerStore.getState().previous());
    bind('nexttrack', () => usePlayerStore.getState().next());
    bind('seekbackward', () => {
      const { currentTime: t, seek } = usePlayerStore.getState();
      seek(Math.max(0, t - 10));
    });
    bind('seekforward', () => {
      const { currentTime: t, duration: d, seek } = usePlayerStore.getState();
      seek(Math.min(d, t + 10));
    });
    bind('seekto', (details) => {
      if (typeof details.seekTime === 'number') usePlayerStore.getState().seek(details.seekTime);
    });
    bind('stop', () => usePlayerStore.getState().pause());

    return () => {
      (['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto', 'stop'] as MediaSessionAction[]).forEach((a) => bind(a, null));
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!('setPositionState' in navigator.mediaSession)) return;
    if (duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(duration, Math.max(0, currentTime)),
        playbackRate: 1,
      });
    } catch { /* throws when values diverge during track change */ }
  }, [duration, currentTime]);
}
