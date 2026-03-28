export interface Song {
  spotifyId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  previewUrl: string | null;
  releaseYear: number;
}

export interface PlacedSong extends Song {
  placedAtIndex: number;
  placedCorrectly: boolean;
}

export type Team = "A" | "B";

export interface GameState {
  songPool: Song[];
  currentSongIndex: number;
  currentTeam: Team;
  teamATimeline: PlacedSong[];
  teamBTimeline: PlacedSong[];
  teamATokens: number;
  teamBTokens: number;
  teamAScore: number;
  teamBScore: number;
  cardsToWin: number;
  winner: Team | null;
}

export interface GameSettings {
  /** Number of correctly placed cards needed to win */
  cardsToWin: number;
  /** Duration of each audio clip in seconds */
  clipDurationSeconds: number;
  /** Time limit for each turn in seconds (0 = no limit) */
  turnTimeLimitSeconds: number;
  /** Tokens awarded for a correct placement */
  tokensPerCorrectGuess: number;
  /** Tokens required to challenge the other team's placement */
  tokensToChallenge: number;
  /** Tokens required to skip the current song */
  tokensToSkip: number;
}

export type GameActionType =
  | "PLACE_SONG"
  | "CHALLENGE"
  | "CHALLENGE_SUCCESS"
  | "CHALLENGE_FAIL"
  | "SKIP"
  | "CORRECT_PLACEMENT"
  | "INCORRECT_PLACEMENT"
  | "GAME_START"
  | "GAME_END"
  | "TURN_TIMEOUT";

export interface GameAction {
  type: GameActionType;
  team: Team;
  timestamp: number;
  song?: Song;
  placedAtIndex?: number;
  details?: string;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  cardsToWin: 5,
  clipDurationSeconds: 30,
  turnTimeLimitSeconds: 0,
  tokensPerCorrectGuess: 1,
  tokensToChallenge: 1,
  tokensToSkip: 1,
};

export const DESIGN_TOKENS = {
  colors: {
    background: "#0a0e1a",
    teamA: "#00d4aa",
    teamB: "#8b5cf6",
    gold: "#f59e0b",
    white: "#ffffff",
  },
} as const;
