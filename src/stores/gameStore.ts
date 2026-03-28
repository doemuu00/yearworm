import { create } from "zustand";
import type {
  GameState,
  GameSettings,
  GameAction,
  Song,
  PlacedSong,
  Team,
} from "@/lib/game/types";
import { DEFAULT_GAME_SETTINGS } from "@/lib/game/types";
import {
  initializeGame,
  placeSong as enginePlaceSong,
  challengePlacement as engineChallengePlacement,
  skipSong as engineSkipSong,
  nextTurn as engineNextTurn,
  resolveUnchallengedPlacement,
} from "@/lib/game/engine";

interface GameStoreState extends GameState {
  // UI state
  isChallengeable: boolean;
  lastPlacedSong: PlacedSong | null;
  lastPlacedTeam: Team | null;
  gameLog: GameAction[];
  settings: GameSettings;

  // Actions
  initGame: (songs: Song[], settings?: GameSettings) => void;
  placeSong: (position: number) => void;
  challengePlacement: () => void;
  skipSong: () => void;
  nextTurn: () => void;
  setGameState: (state: Partial<GameState>) => void;
  endChallengeWindow: () => void;
}

function extractGameState(store: GameStoreState): GameState {
  return {
    songPool: store.songPool,
    currentSongIndex: store.currentSongIndex,
    currentTeam: store.currentTeam,
    teamATimeline: store.teamATimeline,
    teamBTimeline: store.teamBTimeline,
    teamATokens: store.teamATokens,
    teamBTokens: store.teamBTokens,
    teamAScore: store.teamAScore,
    teamBScore: store.teamBScore,
    cardsToWin: store.cardsToWin,
    winner: store.winner,
  };
}

function logAction(
  log: GameAction[],
  type: GameAction["type"],
  team: Team,
  song?: Song,
  placedAtIndex?: number,
  details?: string
): GameAction[] {
  return [
    ...log,
    {
      type,
      team,
      timestamp: Date.now(),
      song,
      placedAtIndex,
      details,
    },
  ];
}

const initialGameState: GameState = {
  songPool: [],
  currentSongIndex: 0,
  currentTeam: "A",
  teamATimeline: [],
  teamBTimeline: [],
  teamATokens: 0,
  teamBTokens: 0,
  teamAScore: 0,
  teamBScore: 0,
  cardsToWin: 5,
  winner: null,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...initialGameState,

  // UI state
  isChallengeable: false,
  lastPlacedSong: null,
  lastPlacedTeam: null,
  gameLog: [],
  settings: DEFAULT_GAME_SETTINGS,

  initGame: (songs: Song[], settings?: GameSettings) => {
    const gameSettings = settings ?? DEFAULT_GAME_SETTINGS;
    const newState = initializeGame(songs, gameSettings);
    set({
      ...newState,
      isChallengeable: false,
      lastPlacedSong: null,
      lastPlacedTeam: null,
      settings: gameSettings,
      gameLog: logAction([], "GAME_START", "A", undefined, undefined, "Game started"),
    });
  },

  placeSong: (position: number) => {
    const store = get();
    const currentState = extractGameState(store);
    const currentSong = currentState.songPool[currentState.currentSongIndex];
    if (!currentSong) return;

    const placingTeam = currentState.currentTeam;
    const newState = enginePlaceSong(currentState, position);

    // Find the placed song in the updated timeline
    const timelineKey = placingTeam === "A" ? "teamATimeline" : "teamBTimeline";
    const placedSong = newState[timelineKey].find(
      (s) => s.spotifyId === currentSong.spotifyId
    ) ?? null;

    const actionType = placedSong?.placedCorrectly
      ? "CORRECT_PLACEMENT"
      : "INCORRECT_PLACEMENT";

    set({
      ...newState,
      isChallengeable: true,
      lastPlacedSong: placedSong,
      lastPlacedTeam: placingTeam,
      gameLog: logAction(
        store.gameLog,
        actionType,
        placingTeam,
        currentSong,
        position,
        `${currentSong.title} placed at position ${position}`
      ),
    });
  },

  challengePlacement: () => {
    const store = get();
    if (!store.isChallengeable || !store.lastPlacedSong || !store.lastPlacedTeam) return;

    const currentState = extractGameState(store);
    const challengingTeam: Team = store.lastPlacedTeam === "A" ? "B" : "A";
    const newState = engineChallengePlacement(
      currentState,
      store.lastPlacedSong,
      store.lastPlacedTeam
    );

    const success = !store.lastPlacedSong.placedCorrectly;
    const actionType = success ? "CHALLENGE_SUCCESS" : "CHALLENGE_FAIL";

    set({
      ...newState,
      isChallengeable: false,
      lastPlacedSong: null,
      lastPlacedTeam: null,
      gameLog: logAction(
        store.gameLog,
        actionType,
        challengingTeam,
        store.lastPlacedSong,
        undefined,
        success
          ? `Challenge succeeded! Card stolen.`
          : `Challenge failed. Bonus token awarded to opponent.`
      ),
    });
  },

  skipSong: () => {
    const store = get();
    const currentState = extractGameState(store);
    const currentSong = currentState.songPool[currentState.currentSongIndex];
    const skippingTeam = currentState.currentTeam;
    const newState = engineSkipSong(currentState);

    set({
      ...newState,
      isChallengeable: false,
      lastPlacedSong: null,
      lastPlacedTeam: null,
      gameLog: logAction(
        store.gameLog,
        "SKIP",
        skippingTeam,
        currentSong ?? undefined,
        undefined,
        `Skipped song`
      ),
    });
  },

  nextTurn: () => {
    const store = get();
    const currentState = extractGameState(store);
    const newState = engineNextTurn(currentState);
    set({ ...newState });
  },

  setGameState: (partial: Partial<GameState>) => {
    set(partial);
  },

  endChallengeWindow: () => {
    const store = get();
    if (!store.isChallengeable || !store.lastPlacedSong || !store.lastPlacedTeam) {
      set({ isChallengeable: false });
      return;
    }

    // If the placement was incorrect and nobody challenged, remove the card
    const currentState = extractGameState(store);
    const resolved = resolveUnchallengedPlacement(
      currentState,
      store.lastPlacedSong,
      store.lastPlacedTeam
    );

    set({
      ...resolved,
      isChallengeable: false,
      lastPlacedSong: null,
      lastPlacedTeam: null,
    });
  },
}));
