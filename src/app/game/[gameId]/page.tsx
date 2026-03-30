'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/stores/gameStore';
import { useTimer } from '@/hooks/useTimer';
import { useAudio } from '@/hooks/useAudio';

import AudioPlayer from '@/components/game/AudioPlayer';
import { DraggableSongCard, DragOverlayCard } from '@/components/game/GameBoard';
import Timeline from '@/components/game/Timeline';
import ScoreBar from '@/components/game/ScoreBar';
import ActionBar from '@/components/game/ActionBar';
import ChallengeModal from '@/components/game/ChallengeModal';
import PlacementResult from '@/components/game/PlacementResult';
import GuessModal from '@/components/game/GuessModal';
import WinScreen from '@/components/game/WinScreen';
import PassAndPlayInterstitial from '@/components/game/PassAndPlayInterstitial';
import TopAppBar from '@/components/layout/TopAppBar';
import type { Team, PlacedSong } from '@/lib/game/types';

/* ── Phase type for local UI state ─────────────────────── */
type Phase = 'playing' | 'challenge-window' | 'challenge-placing' | 'guess-commit' | 'showing-result' | 'guess-verify' | 'pass-device' | 'game-over';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  /* ── Game state from Zustand ──────────────────────────── */
  const {
    songPool,
    currentTeam,
    currentSong,
    currentTeamTimeline,
    currentTeamTokens,
    teamATimeline,
    teamBTimeline,
    teamAScore,
    teamBScore,
    teamATokens,
    teamBTokens,
    cardsToWin,
    winner,
    isChallengeable,
    lastPlacedSong,
    lastPlacedTeam,
    settings,
    placeSong,
    challengePlacement,
    skipSong,
    nextTurn,
    dismissChallenge,
    lastChallengerCorrect,
    guessCommitted,
    commitGuess,
    confirmGuess,
    resetGuess,
    teamName,
  } = useGame();

  /* ── Local UI state ───────────────────────────────────── */
  const [phase, setPhase] = useState<Phase>('playing');
  const [revealed, setRevealed] = useState(false);
  const [songReady, setSongReady] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const activeTeamRef = useRef<Team>(currentTeam);
  const [placementResult, setPlacementResult] = useState<{
    song: PlacedSong;
    placingTeam: Team;
    wasChallenged: boolean;
    challengeSucceeded?: boolean;
    challengerCorrect?: boolean;
  } | null>(null);

  /* ── Audio ────────────────────────────────────────────── */
  const audio = useAudio();

  /* ── DnD sensors ─────────────────────────────────────── */
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  /* ── Turn timer ───────────────────────────────────────── */
  const handleTurnTimeout = useCallback(() => {
    nextTurn();
    audio.stop();
    setSongReady(false);
    setPhase('pass-device');
  }, [nextTurn, audio]);

  const turnTimer = useTimer({ onTimeout: handleTurnTimeout });

  /* ── Redirect if no active game ───────────────────────── */
  useEffect(() => {
    if (songPool.length === 0) {
      router.replace('/');
    }
  }, [songPool.length, router]);

  /* ── Watch for winner ─────────────────────────────────── */
  useEffect(() => {
    if (winner) {
      setPhase('game-over');
      turnTimer.stopTimer();
      audio.stop();
    }
  }, [winner, turnTimer, audio]);

  /* ── Start turn timer when phase is 'playing' ─────────── */
  useEffect(() => {
    if (phase === 'playing' && settings.turnTimeLimitSeconds > 0) {
      turnTimer.startTimer(settings.turnTimeLimitSeconds);
    }
    return () => {
      if (phase === 'playing') {
        turnTimer.stopTimer();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Stop audio & reset when song changes ────────────── */
  useEffect(() => {
    audio.stop();
    setRevealed(false);
    setSongReady(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.spotifyId]);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleSongReady = useCallback(() => {
    setSongReady(true);
  }, []);

  const handlePlaceSong = useCallback(
    (position: number) => {
      if (phase !== 'playing') return;

      turnTimer.stopTimer();
      audio.stop();
      placeSong(position);
      setSongReady(false);

      setPhase('challenge-window');
    },
    [phase, placeSong, turnTimer, audio]
  );

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setIsDragActive(true);
  }, []);

  const handleDragCancel = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const handleChallenge = useCallback(() => {
    setPhase('challenge-placing');
  }, []);

  const handleChallengerPlace = useCallback(
    (position: number) => {
      if (!lastPlacedSong || !lastPlacedTeam) return;

      const wasPlacedCorrectly = lastPlacedSong.placedCorrectly;
      challengePlacement(position);

      const originalWrong = !wasPlacedCorrectly;
      const challengerCorrect = useGameStore.getState().lastChallengerCorrect ?? false;
      const challengeSucceeded = originalWrong && challengerCorrect;

      setPlacementResult({
        song: lastPlacedSong,
        placingTeam: lastPlacedTeam,
        wasChallenged: true,
        challengeSucceeded,
        challengerCorrect,
      });
      setIsDragActive(false);
      audio.stop();
      setRevealed(true);
      setPhase('showing-result');
    },
    [challengePlacement, audio, lastPlacedSong, lastPlacedTeam]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragActive(false);
      const { over } = event;
      if (!over) return;
      const match = String(over.id).match(/^drop-(\d+)$/);
      if (match) {
        const position = parseInt(match[1], 10);
        if (phase === 'challenge-placing') {
          handleChallengerPlace(position);
        } else {
          handlePlaceSong(position);
        }
      }
    },
    [handlePlaceSong, handleChallengerPlace, phase],
  );

  const handleDismissChallenge = useCallback(() => {
    dismissChallenge();

    if (lastPlacedSong && lastPlacedTeam) {
      setPlacementResult({
        song: lastPlacedSong,
        placingTeam: lastPlacedTeam,
        wasChallenged: false,
      });
      audio.stop();
      setRevealed(true);
      setPhase('showing-result');
    } else {
      setPhase('pass-device');
      audio.stop();
    }
  }, [dismissChallenge, audio, lastPlacedSong, lastPlacedTeam]);

  /* ── Guess flow handlers ─────────────────────────────── */
  const handleGuessCommitYes = useCallback(() => {
    commitGuess();
    setPhase('guess-verify');
  }, [commitGuess]);

  const handleGuessCommitNo = useCallback(() => {
    resetGuess();
    setPhase('pass-device');
  }, [resetGuess]);

  const handleSkip = useCallback(() => {
    if (currentTeamTokens < (settings.tokensToSkip ?? 1)) return;

    turnTimer.stopTimer();
    audio.stop();
    skipSong();
    setSongReady(false);

    setPhase('playing');
  }, [currentTeamTokens, settings.tokensToSkip, turnTimer, audio, skipSong]);

  const handleResultDismiss = useCallback(() => {
    setPlacementResult(null);
    setPhase('guess-verify');
  }, []);

  const handleGuessVerifyYes = useCallback(() => {
    commitGuess();
    confirmGuess();
    setPlacementResult(null);
    setPhase('pass-device');
  }, [commitGuess, confirmGuess]);

  const handleGuessVerifyNo = useCallback(() => {
    resetGuess();
    setPlacementResult(null);
    setPhase('pass-device');
  }, [resetGuess]);

  const handlePassDeviceReady = useCallback(() => {
    activeTeamRef.current = currentTeam;
    setRevealed(false);
    setSongReady(false);
    setPhase('playing');
  }, [currentTeam]);

  const handlePlayAgain = useCallback(() => {
    audio.stop();
    router.replace('/');
  }, [audio, router]);

  /* ── Derived values ───────────────────────────────────── */
  const challengingTeam: Team = lastPlacedTeam === 'A' ? 'B' : 'A';
  const canChallenge =
    isChallengeable &&
    (challengingTeam === 'A' ? teamATokens : teamBTokens) >=
      (settings.tokensToChallenge ?? 1);

  const canSkip =
    phase === 'playing' &&
    currentTeamTokens >= (settings.tokensToSkip ?? 1);
  const canSkipReady = canSkip || (songReady && currentTeamTokens >= (settings.tokensToSkip ?? 1));

  const isChallenging = phase === 'challenge-placing';

  // Hide the last-placed card's year and correctness until all overlays are dismissed
  const unrevealed = phase !== 'playing' && phase !== 'pass-device' && phase !== 'game-over';
  const hiddenSongId = unrevealed && lastPlacedSong ? lastPlacedSong.spotifyId : undefined;

  // Single timeline: show active team's data, or placing team's during challenge
  const displayedTeam: Team = isChallenging
    ? (lastPlacedTeam ?? currentTeam)
    : currentTeam;
  const displayedTimeline = displayedTeam === 'A'
    ? (currentTeam === 'A' ? currentTeamTimeline : teamATimeline)
    : (currentTeam === 'B' ? currentTeamTimeline : teamBTimeline);

  /* ── Guard: no song pool yet (redirecting) ─────────── */
  if (songPool.length === 0) {
    return null;
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-surface-container-lowest">
      {/* ── Top App Bar ──────────────────────────────────── */}
      <TopAppBar />

      {/* ── Main layout (wrapped in DndContext) ───────────── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <main className="flex-1 flex flex-col pt-12 min-h-0 overflow-hidden">
          {/* Score bar */}
          <ScoreBar
            teamALabel={teamName('A')}
            teamBLabel={teamName('B')}
            teamAScore={teamAScore}
            teamBScore={teamBScore}
            teamATokens={teamATokens}
            teamBTokens={teamBTokens}
            cardsToWin={cardsToWin}
            activeTeam={currentTeam}
            displayedTeam={displayedTeam}
            timeRemaining={
              phase === 'playing' && settings.turnTimeLimitSeconds > 0
                ? turnTimer.timeRemaining
                : undefined
            }
            isTimerRunning={turnTimer.isRunning}
            isChallenging={isChallenging}
            challengingTeamLabel={teamName(challengingTeam)}
            placingTeamLabel={teamName(lastPlacedTeam)}
          />

          {/* Single timeline — full width */}
          <div className="relative flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayedTeam}
                className="absolute inset-0 px-4 md:px-12 lg:px-24"
                initial={{ opacity: 0, x: displayedTeam === 'A' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: displayedTeam === 'A' ? 20 : -20 }}
                transition={{ duration: 0.25 }}
              >
                <Timeline
                  timeline={displayedTimeline}
                  team={displayedTeam}
                  isActiveTeam={true}
                  onPlaceSong={isChallenging ? handleChallengerPlace : handlePlaceSong}
                  isDragActive={isDragActive}
                  compact={false}
                  mirrorLayout={false}
                  ghostSongId={isChallenging && lastPlacedSong ? lastPlacedSong.spotifyId : undefined}
                  hiddenSongId={lastPlacedTeam === displayedTeam ? hiddenSongId : undefined}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action bar at bottom */}
          <ActionBar
            phase={phase}
            currentSong={currentSong}
            songReady={songReady}
            currentTeam={currentTeam}
            isChallenging={isChallenging}
            lastPlacedSong={lastPlacedSong}
            challengingTeam={challengingTeam}
            placingTeamLabel={teamName(lastPlacedTeam)}
            onSkip={handleSkip}
            canSkip={canSkipReady}
            audioPlayer={
              <AudioPlayer
                previewUrl={currentSong?.previewUrl ?? null}
                albumArtUrl={currentSong?.albumArtUrl ?? ''}
                title={currentSong?.title ?? 'Unknown'}
                artist={currentSong?.artist ?? 'Unknown'}
                revealed={revealed}
                clipDuration={settings.clipDurationSeconds}
                onSongReady={handleSongReady}
                onSkip={handleSkip}
                canSkip={canSkip}
                team={currentTeam}
              />
            }
          />
        </main>

        {/* Floating drag overlay that follows the cursor */}
        <DragOverlay dropAnimation={null}>
          {isDragActive && isChallenging && lastPlacedSong ? (
            <DragOverlayCard song={lastPlacedSong} team={challengingTeam} />
          ) : isDragActive && currentSong ? (
            <DragOverlayCard song={currentSong} team={currentTeam} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Modal: Guess (after reveal) ───────────────────── */}
      <GuessModal
        isOpen={phase === 'guess-verify'}
        mode="verify"
        placingTeam={lastPlacedTeam}
        teamLabel={teamName(lastPlacedTeam)}
        onYes={handleGuessVerifyYes}
        onNo={handleGuessVerifyNo}
      />

      {/* ── Modal: Challenge window ─────────────────────── */}
      <ChallengeModal
        isOpen={phase === 'challenge-window'}
        challengingTeam={challengingTeam}
        placedSong={lastPlacedSong}
        placingTeam={lastPlacedTeam}
        canChallenge={canChallenge}
        onChallenge={handleChallenge}
        onDismiss={handleDismissChallenge}
        placingTeamLabel={teamName(lastPlacedTeam)}
        challengingTeamLabel={teamName(challengingTeam)}
      />

      {/* ── Modal: Placement result overlay ───────────── */}
      <PlacementResult
        isOpen={phase === 'showing-result' && placementResult !== null}
        song={placementResult?.song ?? null}
        placingTeam={placementResult?.placingTeam ?? null}
        wasChallenged={placementResult?.wasChallenged ?? false}
        challengeSucceeded={placementResult?.challengeSucceeded}
        challengerCorrect={placementResult?.challengerCorrect}
        onDismiss={handleResultDismiss}
        teamLabel={(t) => teamName(t)}
      />

      {/* ── Modal: Pass-and-play interstitial ───────────── */}
      <AnimatePresence>
        {phase === 'pass-device' && !winner && (
          <PassAndPlayInterstitial
            team={currentTeam}
            teamLabel={teamName(currentTeam)}
            onReady={handlePassDeviceReady}
          />
        )}
      </AnimatePresence>

      {/* ── Modal: Win screen ───────────────────────────── */}
      <AnimatePresence>
        {phase === 'game-over' && winner && (
          <WinScreen
            winner={winner}
            teamAScore={teamAScore}
            teamBScore={teamBScore}
            cardsToWin={cardsToWin}
            onPlayAgain={handlePlayAgain}
            winnerLabel={teamName(winner)}
            loserLabel={teamName(winner === 'A' ? 'B' : 'A')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
