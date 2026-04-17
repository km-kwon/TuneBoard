import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

/**
 * Invisible aria-live region that announces track changes to assistive
 * technology. Paired with the visual marquee in the player bar so
 * screen-reader users aren't left in the dark when playback advances.
 */
export function TrackAnnouncer() {
  const track = usePlayerStore((s) => s.currentTrack);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!track) {
      setMessage('');
      return;
    }
    const artists = track.artists.map((a) => a.name).join(', ');
    setMessage(`Now playing: ${track.title} by ${artists}`);
  }, [track?.videoId]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
