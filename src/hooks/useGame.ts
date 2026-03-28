"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getCurrentSong } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";

/**
 * Hook that wraps the Zustand game store and adds derived convenience values.
 */
export function useGame() {
  const store = useGameStore();

  const gameState: GameState = useMemo(
    () => ({
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
    }),
    [
      store.songPool,
      store.currentSongIndex,
      store.currentTeam,
      store.teamATimeline,
      store.teamBTimeline,
      store.teamATokens,
      store.teamBTokens,
      store.teamAScore,
      store.teamBScore,
      store.cardsToWin,
      store.winner,
    ]
  );

  const currentSong = useMemo(
    () => getCurrentSong(gameState),
    [gameState]
  );

  const currentTeamTimeline = useMemo(
    () =>
      store.currentTeam === "A"
        ? store.teamATimeline
        : store.teamBTimeline,
    [store.currentTeam, store.teamATimeline, store.teamBTimeline]
  );

  const currentTeamTokens = useMemo(
    () =>
      store.currentTeam === "A"
        ? store.teamATokens
        : store.teamBTokens,
    [store.currentTeam, store.teamATokens, store.teamBTokens]
  );

  return {
    // Game state
    ...gameState,

    // Derived values
    currentSong,
    currentTeamTimeline,
    currentTeamTokens,

    // UI state
    isChallengeable: store.isChallengeable,
    lastPlacedSong: store.lastPlacedSong,
    lastPlacedTeam: store.lastPlacedTeam,
    lastChallengerCorrect: store.lastChallengerCorrect,
    gameLog: store.gameLog,
    settings: store.settings,

    // Actions
    initGame: store.initGame,
    placeSong: store.placeSong,
    challengePlacement: store.challengePlacement,
    skipSong: store.skipSong,
    nextTurn: store.nextTurn,
    setGameState: store.setGameState,
    dismissChallenge: store.dismissChallenge,
  };
}
