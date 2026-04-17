import type { YTApi, YTPlayer } from './youtube.types';

/**
 * Singleton script loader. Multiple callers share the same promise.
 */
let loadPromise: Promise<YTApi> | null = null;

export function loadYouTubeIframeAPI(): Promise<YTApi> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const existing = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existing?.();
      if (window.YT) resolve(window.YT);
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  });

  return loadPromise;
}

/**
 * Module-level mutable ref to the active player instance. Set by useYouTubePlayer
 * once the iframe is ready, cleared on unmount.
 *
 * Functions below are safe no-ops while the player is null — calls during the
 * brief loading window are dropped on purpose.
 */
let player: YTPlayer | null = null;

export function setPlayer(p: YTPlayer | null) {
  player = p;
}

export function ytLoad(videoId: string, startSec = 0) {
  player?.loadVideoById({ videoId, startSeconds: startSec });
}
export function ytPlay() {
  player?.playVideo();
}
export function ytPause() {
  player?.pauseVideo();
}
export function ytSeek(sec: number) {
  player?.seekTo(sec, true);
}
export function ytSetVolume(v: number) {
  player?.setVolume(v);
}
export function ytMute() {
  player?.mute();
}
export function ytUnMute() {
  player?.unMute();
}
export function ytGetTime(): number {
  return player?.getCurrentTime() ?? 0;
}
export function ytGetDuration(): number {
  return player?.getDuration() ?? 0;
}
export function ytIsAttached(): boolean {
  return player !== null;
}
