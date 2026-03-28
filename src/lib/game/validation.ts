import type { PlacedSong, Song } from "./types";

/**
 * Check if placing a song at a given position results in correct chronological order.
 *
 * A song is correctly placed if:
 * 1. Its release year >= the year of the song to its left (or it's leftmost)
 * 2. Its release year <= the year of the song to its right (or it's rightmost)
 * 3. Same year in any relative order is accepted
 *
 * @param timeline - The current timeline (before insertion)
 * @param song - The song being placed
 * @param position - The index where the song will be inserted (0 = leftmost, timeline.length = rightmost)
 */
export function validatePlacement(
  timeline: PlacedSong[],
  song: Song,
  position: number
): boolean {
  const leftNeighbor: PlacedSong | undefined = timeline[position - 1];
  const rightNeighbor: PlacedSong | undefined = timeline[position];

  if (leftNeighbor && song.releaseYear < leftNeighbor.releaseYear) {
    return false;
  }

  if (rightNeighbor && song.releaseYear > rightNeighbor.releaseYear) {
    return false;
  }

  return true;
}

/**
 * Find the correct insertion position for a song in a timeline.
 * Returns the leftmost valid position.
 */
export function findCorrectPosition(
  timeline: PlacedSong[],
  song: Song
): number {
  for (let i = 0; i <= timeline.length; i++) {
    if (validatePlacement(timeline, song, i)) {
      return i;
    }
  }
  // Fallback — should not happen if timeline is valid
  return timeline.length;
}

/**
 * Check if an entire timeline is in chronological order (non-decreasing release years).
 */
export function isTimelineValid(timeline: PlacedSong[]): boolean {
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].releaseYear < timeline[i - 1].releaseYear) {
      return false;
    }
  }
  return true;
}
