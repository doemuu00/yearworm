import type { Song } from './types';

/**
 * Local song database for demo/testing purposes.
 * These files are gitignored and not deployed — for local development only.
 */
export const DEMO_SONGS: Song[] = [
  {
    spotifyId: 'demo-01',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    albumArtUrl: '',
    previewUrl: '/songs/bohemian-rhapsody.mp3',
    releaseYear: 1975,
  },
  {
    spotifyId: 'demo-02',
    title: "Stayin' Alive",
    artist: 'Bee Gees',
    albumArtUrl: '',
    previewUrl: '/songs/stayin-alive.mp3',
    releaseYear: 1977,
  },
  {
    spotifyId: 'demo-03',
    title: 'Hotel California',
    artist: 'Eagles',
    albumArtUrl: '',
    previewUrl: '/songs/hotel-california.mp3',
    releaseYear: 1977,
  },
  {
    spotifyId: 'demo-04',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    albumArtUrl: '',
    previewUrl: '/songs/billie-jean.mp3',
    releaseYear: 1982,
  },
  {
    spotifyId: 'demo-05',
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    albumArtUrl: '',
    previewUrl: '/songs/sweet-child-o-mine.mp3',
    releaseYear: 1987,
  },
  {
    spotifyId: 'demo-06',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    albumArtUrl: '',
    previewUrl: '/songs/smells-like-teen-spirit.mp3',
    releaseYear: 1991,
  },
  {
    spotifyId: 'demo-07',
    title: 'I Want It That Way',
    artist: 'Backstreet Boys',
    albumArtUrl: '',
    previewUrl: '/songs/i-want-it-that-way.mp3',
    releaseYear: 1999,
  },
  {
    spotifyId: 'demo-08',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    albumArtUrl: '',
    previewUrl: '/songs/rolling-in-the-deep.mp3',
    releaseYear: 2010,
  },
  {
    spotifyId: 'demo-09',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    albumArtUrl: '',
    previewUrl: '/songs/shape-of-you.mp3',
    releaseYear: 2017,
  },
  {
    spotifyId: 'demo-10',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    albumArtUrl: '',
    previewUrl: '/songs/blinding-lights.mp3',
    releaseYear: 2019,
  },
];
