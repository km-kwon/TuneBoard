import type { Track } from '@/types';

/**
 * Phase 2 fixtures. Real, well-known public YouTube videoIds for end-to-end
 * playback testing. Replace with ytmusicapi data in Phase 3.
 */
export const DUMMY_TRACKS: Track[] = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artists: [{ id: 'rick', name: 'Rick Astley' }],
    album: { id: 'whenever', name: 'Whenever You Need Somebody' },
    durationSec: 213,
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artists: [{ id: 'queen', name: 'Queen' }],
    album: { id: 'night-opera', name: 'A Night at the Opera' },
    durationSec: 354,
    thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artists: [{ id: 'ed', name: 'Ed Sheeran' }],
    album: { id: 'divide', name: '\u00f7 (Divide)' },
    durationSec: 263,
    thumbnailUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
  },
  {
    videoId: '60ItHLz5WEA',
    title: 'Faded',
    artists: [{ id: 'alan', name: 'Alan Walker' }],
    album: { id: 'different-world', name: 'Different World' },
    durationSec: 212,
    thumbnailUrl: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg',
  },
  {
    videoId: 'hT_nvWreIhg',
    title: 'Counting Stars',
    artists: [{ id: 'or', name: 'OneRepublic' }],
    album: { id: 'native', name: 'Native' },
    durationSec: 257,
    thumbnailUrl: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artists: [
      { id: 'fonsi', name: 'Luis Fonsi' },
      { id: 'yankee', name: 'Daddy Yankee' },
    ],
    album: { id: 'vida', name: 'Vida' },
    durationSec: 281,
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
  },
  {
    videoId: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artists: [
      { id: 'ronson', name: 'Mark Ronson' },
      { id: 'bruno', name: 'Bruno Mars' },
    ],
    album: { id: 'uptown-special', name: 'Uptown Special' },
    durationSec: 269,
    thumbnailUrl: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
  },
  {
    videoId: '9bZkp7q19f0',
    title: 'Gangnam Style',
    artists: [{ id: 'psy', name: 'PSY' }],
    durationSec: 253,
    thumbnailUrl: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',
  },
];

export function getThumbUrl(videoId: string, quality: 'hq' | 'mq' | 'max' = 'hq') {
  const map = { hq: 'hqdefault', mq: 'mqdefault', max: 'maxresdefault' };
  return `https://i.ytimg.com/vi/${videoId}/${map[quality]}.jpg`;
}
