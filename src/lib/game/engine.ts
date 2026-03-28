import type {
  GameState,
  GameSettings,
  Song,
  PlacedSong,
  Team,
} from "./types";
import { validatePlacement, findCorrectPosition } from "./validation";
import { applyTokenChange } from "./tokens";

/**
 * Get the current song to be placed from the song pool.
 */
export function getCurrentSong(state: GameState): Song | null {
  if (state.currentSongIndex >= state.songPool.length) {
    return null;
  }
  return state.songPool[state.currentSongIndex];
}

/**
 * Place a song at a position in the current team's timeline.
 * Returns updated state with the song placed, score/tokens updated, and turn advanced.
 */
export function placeSong(state: GameState, position: number): GameState {
  const song = getCurrentSong(state);
  if (!song) return state;

  const timelineKey =
    state.currentTeam === "A" ? "teamATimeline" : "teamBTimeline";
  const tokensKey =
    state.currentTeam === "A" ? "teamATokens" : "teamBTokens";
  const scoreKey =
    state.currentTeam === "A" ? "teamAScore" : "teamBScore";

  const currentTimeline = state[timelineKey];
  const isCorrect = validatePlacement(currentTimeline, song, position);

  const placedSong: PlacedSong = {
    ...song,
    placedAtIndex: position,
    placedCorrectly: isCorrect,
  };

  // Insert the song at the specified position
  const newTimeline = [
    ...currentTimeline.slice(0, position),
    placedSong,
    ...currentTimeline.slice(position),
  ];

  // Update indices after insertion
  const reindexedTimeline = newTimeline.map((s, i) => ({
    ...s,
    placedAtIndex: i,
  }));

  let newTokens = state[tokensKey];
  let newScore = state[scoreKey];

  if (isCorrect) {
    newTokens = applyTokenChange(newTokens, 1);
    newScore += 1;
  }

  const newState: GameState = {
    ...state,
    [timelineKey]: reindexedTimeline,
    [tokensKey]: newTokens,
    [scoreKey]: newScore,
    currentSongIndex: state.currentSongIndex + 1,
    currentTeam: state.currentTeam === "A" ? "B" : "A",
  };

  // Check for a winner after placement
  const winner = checkWinCondition(newState);
  if (winner) {
    return { ...newState, winner };
  }

  return newState;
}

/**
 * Challenge the last placement by the opposing team.
 *
 * If the placement was wrong (challenge succeeds):
 *   - The incorrectly placed card is removed from the placing team's timeline
 *   - The challenger's team gets the card added to their timeline at the correct position
 *   - The challenger earns 1 token
 *
 * If the placement was correct (challenge fails):
 *   - The placing team gets a bonus token
 */
export function challengePlacement(
  state: GameState,
  lastPlacedSong: PlacedSong,
  lastPlacedTeam: Team
): GameState {
  const challengingTeam: Team = lastPlacedTeam === "A" ? "B" : "A";

  const challengerTokensKey =
    challengingTeam === "A" ? "teamATokens" : "teamBTokens";
  const placerTokensKey =
    lastPlacedTeam === "A" ? "teamATokens" : "teamBTokens";
  const placerTimelineKey =
    lastPlacedTeam === "A" ? "teamATimeline" : "teamBTimeline";
  const challengerTimelineKey =
    challengingTeam === "A" ? "teamATimeline" : "teamBTimeline";
  const challengerScoreKey =
    challengingTeam === "A" ? "teamAScore" : "teamBScore";
  const placerScoreKey =
    lastPlacedTeam === "A" ? "teamAScore" : "teamBScore";

  // Spend the challenge token
  let challengerTokens = applyTokenChange(state[challengerTokensKey], -1);

  if (!lastPlacedSong.placedCorrectly) {
    // Challenge succeeds: remove card from placer, give to challenger
    const placerTimeline = state[placerTimelineKey]
      .filter(
        (s) => s.spotifyId !== lastPlacedSong.spotifyId
      )
      .map((s, i) => ({ ...s, placedAtIndex: i }));

    const placerScore = state[placerScoreKey] - 1;

    // Add the song to the challenger's timeline at the end (as a correct placement bonus)
    const challengerTimeline = state[challengerTimelineKey];
    const stolenSong: PlacedSong = {
      ...lastPlacedSong,
      placedAtIndex: challengerTimeline.length,
      placedCorrectly: true,
    };

    // Find correct position for the stolen card
    const correctPos = findCorrectPosition(challengerTimeline, lastPlacedSong);
    const newChallengerTimeline = [
      ...challengerTimeline.slice(0, correctPos),
      { ...stolenSong, placedAtIndex: correctPos },
      ...challengerTimeline.slice(correctPos),
    ].map((s, i) => ({ ...s, placedAtIndex: i }));

    challengerTokens = applyTokenChange(challengerTokens, 1);

    return {
      ...state,
      [placerTimelineKey]: placerTimeline,
      [placerScoreKey]: Math.max(0, placerScore),
      [challengerTimelineKey]: newChallengerTimeline,
      [challengerScoreKey]: state[challengerScoreKey] + 1,
      [challengerTokensKey]: challengerTokens,
    };
  } else {
    // Challenge fails: placing team gets a bonus token
    const placerTokens = applyTokenChange(state[placerTokensKey], 1);

    return {
      ...state,
      [challengerTokensKey]: challengerTokens,
      [placerTokensKey]: placerTokens,
    };
  }
}

/**
 * Resolve an unchallenged placement. If the placement was incorrect, remove
 * the card from the timeline and adjust the score. Called when the challenge
 * window expires without a challenge.
 */
export function resolveUnchallengedPlacement(
  state: GameState,
  placedSong: PlacedSong,
  placedTeam: Team
): GameState {
  if (placedSong.placedCorrectly) {
    return state;
  }

  const timelineKey = placedTeam === "A" ? "teamATimeline" : "teamBTimeline";
  const scoreKey = placedTeam === "A" ? "teamAScore" : "teamBScore";

  const newTimeline = state[timelineKey]
    .filter((s) => s.spotifyId !== placedSong.spotifyId)
    .map((s, i) => ({ ...s, placedAtIndex: i }));

  return {
    ...state,
    [timelineKey]: newTimeline,
    [scoreKey]: Math.max(0, state[scoreKey]),
  };
}

/**
 * Skip the current song (costs 1 token). Advances to next song and switches turn.
 */
export function skipSong(state: GameState): GameState {
  const tokensKey =
    state.currentTeam === "A" ? "teamATokens" : "teamBTokens";

  const newTokens = applyTokenChange(state[tokensKey], -1);

  return {
    ...state,
    [tokensKey]: newTokens,
    currentSongIndex: state.currentSongIndex + 1,
    currentTeam: state.currentTeam === "A" ? "B" : "A",
  };
}

/**
 * Check if either team has won (reached cardsToWin correctly placed cards).
 */
export function checkWinCondition(state: GameState): Team | null {
  if (state.teamAScore >= state.cardsToWin) return "A";
  if (state.teamBScore >= state.cardsToWin) return "B";
  return null;
}

/**
 * Advance to the next team's turn.
 */
export function nextTurn(state: GameState): GameState {
  return {
    ...state,
    currentTeam: state.currentTeam === "A" ? "B" : "A",
  };
}

/**
 * Initialize a new game state from settings and song pool.
 */
export function initializeGame(
  songs: Song[],
  settings: GameSettings
): GameState {
  // Place the first song as a seed on both timelines (revealed, with year shown)
  const seedSong = songs[0];
  const seedPlaced: PlacedSong = {
    ...seedSong,
    placedAtIndex: 0,
    placedCorrectly: true,
  };

  return {
    songPool: songs,
    currentSongIndex: 1, // Start from second song since first is the seed
    currentTeam: "A",
    teamATimeline: [seedPlaced],
    teamBTimeline: [seedPlaced],
    teamATokens: 0,
    teamBTokens: 0,
    teamAScore: 0,
    teamBScore: 0,
    cardsToWin: settings.cardsToWin,
    winner: null,
  };
}
