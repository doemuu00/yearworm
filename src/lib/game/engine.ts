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

  const newState: GameState = {
    ...state,
    [timelineKey]: reindexedTimeline,
    currentSongIndex: state.currentSongIndex + 1,
    currentTeam: state.currentTeam === "A" ? "B" : "A",
  };

  // Derive scores from timelines
  newState.teamAScore = getTeamScore(newState, "A");
  newState.teamBScore = getTeamScore(newState, "B");

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
 * The challenger physically places the card where they think it belongs on the
 * placer's timeline. Three outcomes:
 *   a) Original was correct -> card stays, challenger just lost a token.
 *   b) Original wrong, challenger correct -> card stolen to challenger's timeline.
 *   c) Original wrong, challenger also wrong -> card removed, challenger lost a token.
 *
 * Returns { state, challengerCorrect } so the UI can distinguish (b) from (c).
 */
export function challengePlacement(
  state: GameState,
  lastPlacedSong: PlacedSong,
  lastPlacedTeam: Team,
  challengerPosition: number
): { state: GameState; challengerCorrect: boolean } {
  const challengingTeam: Team = lastPlacedTeam === "A" ? "B" : "A";

  const challengerTokensKey =
    challengingTeam === "A" ? "teamATokens" : "teamBTokens";
  const placerTimelineKey =
    lastPlacedTeam === "A" ? "teamATimeline" : "teamBTimeline";
  const challengerTimelineKey =
    challengingTeam === "A" ? "teamATimeline" : "teamBTimeline";

  // Spend the challenge token
  const challengerTokens = applyTokenChange(state[challengerTokensKey], -1);

  const originalCorrect = lastPlacedSong.placedCorrectly;

  // Remove the song from the placer's timeline to evaluate challenger's position
  const cleanedPlacerTimeline = state[placerTimelineKey]
    .filter((s) => s.spotifyId !== lastPlacedSong.spotifyId)
    .map((s, i) => ({ ...s, placedAtIndex: i }));

  const challengerCorrect = validatePlacement(
    cleanedPlacerTimeline,
    lastPlacedSong,
    challengerPosition
  );

  if (originalCorrect) {
    // (a) Original was correct — card stays, challenger just lost a token
    const newState = {
      ...state,
      [challengerTokensKey]: challengerTokens,
    };
    return { state: newState, challengerCorrect };
  }

  if (challengerCorrect) {
    // (b) Original wrong, challenger correct — steal card to challenger's timeline
    const challengerTimeline = state[challengerTimelineKey];
    const correctPos = findCorrectPosition(challengerTimeline, lastPlacedSong);
    const stolenSong: PlacedSong = {
      ...lastPlacedSong,
      placedAtIndex: correctPos,
      placedCorrectly: true,
    };
    const newChallengerTimeline = [
      ...challengerTimeline.slice(0, correctPos),
      stolenSong,
      ...challengerTimeline.slice(correctPos),
    ].map((s, i) => ({ ...s, placedAtIndex: i }));

    const newState: GameState = {
      ...state,
      [placerTimelineKey]: cleanedPlacerTimeline,
      [challengerTimelineKey]: newChallengerTimeline,
      [challengerTokensKey]: challengerTokens,
    };
    newState.teamAScore = getTeamScore(newState, "A");
    newState.teamBScore = getTeamScore(newState, "B");
    return { state: newState, challengerCorrect };
  }

  // (c) Original wrong, challenger also wrong — remove card, challenger lost a token
  const newState: GameState = {
    ...state,
    [placerTimelineKey]: cleanedPlacerTimeline,
    [challengerTokensKey]: challengerTokens,
  };
  newState.teamAScore = getTeamScore(newState, "A");
  newState.teamBScore = getTeamScore(newState, "B");
  return { state: newState, challengerCorrect };
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

  const newTimeline = state[timelineKey]
    .filter((s) => s.spotifyId !== placedSong.spotifyId)
    .map((s, i) => ({ ...s, placedAtIndex: i }));

  const newState: GameState = {
    ...state,
    [timelineKey]: newTimeline,
  };
  newState.teamAScore = getTeamScore(newState, "A");
  newState.teamBScore = getTeamScore(newState, "B");
  return newState;
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
 * Derive a team's score: count of correctly placed cards on their timeline.
 */
export function getTeamScore(state: GameState, team: Team): number {
  const timeline = team === "A" ? state.teamATimeline : state.teamBTimeline;
  return timeline.filter((s) => s.placedCorrectly).length;
}

/**
 * Award a token to a team (e.g. for correctly guessing artist/song).
 */
export function awardGuessToken(state: GameState, team: Team): GameState {
  const tokensKey = team === "A" ? "teamATokens" : "teamBTokens";
  return {
    ...state,
    [tokensKey]: applyTokenChange(state[tokensKey], 1),
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
  // Place different seed songs on each timeline (revealed, with year shown)
  const seedA: PlacedSong = {
    ...songs[0],
    placedAtIndex: 0,
    placedCorrectly: true,
  };
  const seedB: PlacedSong = {
    ...songs[1],
    placedAtIndex: 0,
    placedCorrectly: true,
  };

  return {
    songPool: songs,
    currentSongIndex: 2, // Start from third song since first two are seeds
    currentTeam: "A",
    teamATimeline: [seedA],
    teamBTimeline: [seedB],
    teamATokens: 2,
    teamBTokens: 2,
    teamAScore: 0,
    teamBScore: 0,
    cardsToWin: settings.cardsToWin,
    winner: null,
  };
}
