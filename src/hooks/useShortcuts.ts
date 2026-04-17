import { useHotkeys } from 'react-hotkeys-hook';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';

export function useGlobalShortcuts() {
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const closeNowPlaying = usePlayerStore((s) => s.closeNowPlaying);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const closePanel = useUIStore((s) => s.closePanel);

  useHotkeys(
    'space',
    (e) => {
      e.preventDefault();
      togglePlay();
    },
    { enableOnFormTags: false },
  );

  useHotkeys('left', (e) => {
    e.preventDefault();
    const t = usePlayerStore.getState().currentTime;
    seek(Math.max(0, t - 5));
  });

  useHotkeys('right', (e) => {
    e.preventDefault();
    const { currentTime, duration } = usePlayerStore.getState();
    seek(Math.min(duration, currentTime + 5));
  });

  useHotkeys('shift+left', (e) => {
    e.preventDefault();
    previous();
  });

  useHotkeys('shift+right', (e) => {
    e.preventDefault();
    next();
  });

  useHotkeys('up', (e) => {
    e.preventDefault();
    setVolume(usePlayerStore.getState().volume + 5);
  });

  useHotkeys('down', (e) => {
    e.preventDefault();
    setVolume(usePlayerStore.getState().volume - 5);
  });

  useHotkeys('m', () => toggleMute());
  useHotkeys('s', () => toggleShuffle());
  useHotkeys('r', () => toggleRepeat());

  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    toggleSidebar();
  });

  useHotkeys('escape', () => {
    const { nowPlayingOpen } = usePlayerStore.getState();
    const { panels } = useUIStore.getState();
    if (nowPlayingOpen) {
      closeNowPlaying();
    } else if (panels.queue) {
      closePanel('queue');
    }
  });
}
