/**
 * Shuffle an array in place using the Fisher-Yates (Knuth) algorithm.
 * Returns the same array reference, now shuffled.
 */
export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Return a new shuffled copy of the array, leaving the original unchanged.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  return shuffleInPlace([...array]);
}
