import { useEffect, useRef } from 'react';
import {
  loadYouTubeIframeAPI,
  setPlayer,
  ytGetTime,
  ytGetDuration,
  ytIsAttached,
} from '@/lib/youtubeApi';
import type { YTPlayer, YTPlayerEvent } from '@/lib/youtube.types';
import { usePlayerStore } from '@/stores/playerStore';

/**
 * Owns the single hidden YouTube IFrame Player. Returns a ref to attach to a
 * mount node. Exactly one instance should exist (mounted at AppShell).
 */
export function useYouTubePlayer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let playerInstance: YTPlayer | null = null;

    loadYouTubeIframeAPI().then((YT) => {
      if (cancelled || !mountRef.current || !window.YT) return;

      playerInstance = new YT.Player(mountRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: YTPlayerEvent) => {
            setPlayer(e.target);
            const { volume, isMuted } = usePlayerStore.getState();
            e.target.setVolume(volume);
            if (isMuted) e.target.mute();
            usePlayerStore.getState()._setReady(true);
          },
          onStateChange: (e: YTPlayerEvent) => {
            const state = e.data;
            const PS = window.YT?.PlayerState;
            if (!PS) return;
            const store = usePlayerStore.getState();
            switch (state) {
              case PS.PLAYING:
                store._setStatus('playing');
                break;
              case PS.PAUSED:
                store._setStatus('paused');
                break;
              case PS.BUFFERING:
                store._setStatus('loading');
                break;
              case PS.ENDED:
                store._setStatus('ended');
                store.next();
                break;
              case PS.CUED:
                store._setStatus('paused');
                break;
              default:
                break;
            }
          },
          onError: (e: YTPlayerEvent) => {
            // 2: invalid id, 100: not found, 101/150: embed disallowed
            console.warn('[yt] error', e.data);
            usePlayerStore.getState()._setStatus('paused');
          },
        },
      });
    });

    return () => {
      cancelled = true;
      setPlayer(null);
      usePlayerStore.getState()._setReady(false);
      try {
        playerInstance?.destroy();
      } catch {
        /* ignore — strict-mode double-invoke can race destroy */
      }
    };
  }, []);

  // rAF progress loop. Lives independently of the player lifecycle so it can
  // start/stop without coupling to API readiness.
  useEffect(() => {
    let rafId = 0;
    let lastUpdate = 0;
    const TICK_MS = 200;

    const tick = (now: number) => {
      if (ytIsAttached() && now - lastUpdate >= TICK_MS) {
        lastUpdate = now;
        const t = ytGetTime();
        const d = ytGetDuration();
        if (Number.isFinite(t) && d > 0) {
          usePlayerStore.getState()._setProgress(t, d);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return mountRef;
}
