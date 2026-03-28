/**
 * Check if a team has enough tokens to challenge the opposing team's placement.
 */
export function canChallenge(tokens: number, cost: number): boolean {
  return tokens >= cost;
}

/**
 * Check if a team has enough tokens to skip the current song.
 */
export function canSkip(tokens: number, cost: number): boolean {
  return tokens >= cost;
}

/**
 * Apply a token change (positive or negative), clamping at 0.
 */
export function applyTokenChange(currentTokens: number, change: number): number {
  return Math.max(0, currentTokens + change);
}
