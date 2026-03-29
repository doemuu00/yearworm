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
import GameBoard from '@/components/game/GameBoard';
import { DraggableSongCard, DragOverlayCard } from '@/components/game/GameBoard';
import Timeline from '@/components/game/Timeline';
import TurnIndicator from '@/components/game/TurnIndicator';
import { TeamPanel } from '@/components/game/ScoreBoard';
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
  } = useGame();

  /* ── Local UI state ───────────────────────────────────── */
  const [phase, setPhase] = useState<Phase>('playing');
  const [revealed, setRevealed] = useState(false);
  const [songReady, setSongReady] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  // Track the team whose turn we're showing (to support pass-device correctly)
  const activeTeamRef = useRef<Team>(currentTeam);
  // Placement result overlay state
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
      // Go to guess-commit before revealing
      setPhase('guess-commit');
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
      // Go to guess-commit before revealing
      setPhase('guess-commit');
    } else {
      setPhase('pass-device');
      audio.stop();
    }
  }, [dismissChallenge, audio, lastPlacedSong, lastPlacedTeam]);

  /* ── Guess flow handlers ─────────────────────────────── */
  const handleGuessCommitYes = useCallback(() => {
    commitGuess();
    setRevealed(true);
    setPhase('showing-result');
  }, [commitGuess]);

  const handleGuessCommitNo = useCallback(() => {
    resetGuess();
    setRevealed(true);
    setPhase('showing-result');
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
    if (guessCommitted) {
      // Go to guess-verify to confirm if guess was correct
      setPhase('guess-verify');
    } else {
      setPlacementResult(null);
      setPhase('pass-device');
    }
  }, [guessCommitted]);

  const handleGuessVerifyYes = useCallback(() => {
    confirmGuess();
    setPlacementResult(null);
    setPhase('pass-device');
  }, [confirmGuess]);

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

  const showDraggableCard = songReady && currentSong;
  const isChallenging = phase === 'challenge-placing';

  // Hide the last-placed card's year and correctness until all overlays are dismissed
  const unrevealed = phase !== 'playing' && phase !== 'pass-device' && phase !== 'game-over';
  const hiddenSongId = unrevealed && lastPlacedSong ? lastPlacedSong.spotifyId : undefined;

  // Always Team A left, Team B right
  // During challenge-placing, the placing team's timeline is active for the challenger
  const teamATimelineData = currentTeam === 'A' ? currentTeamTimeline : teamATimeline;
  const teamBTimelineData = currentTeam === 'B' ? currentTeamTimeline : teamBTimeline;

  // During challenge: the PLACING team's timeline is active (challenger drops there)
  const teamAIsActive = isChallenging
    ? lastPlacedTeam === 'A'
    : currentTeam === 'A';
  const teamBIsActive = isChallenging
    ? lastPlacedTeam === 'B'
    : currentTeam === 'B';

  /* ── Guard: no song pool yet (redirecting) ─────────── */
  if (songPool.length === 0) {
    return null;
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-container-lowest">
      {/* ── Top App Bar ──────────────────────────────────── */}
      <TopAppBar />

      {/* ── Main 3-column grid layout (wrapped in DndContext) ── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <main className="flex-1 pt-24 pb-28 px-4 md:px-8 grid grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
          {/* LEFT COLUMN: Team A */}
          <section className="col-span-12 md:col-span-3 flex flex-col gap-2 min-h-0">
            <TeamPanel
              label="Team A"
              team="A"
              score={teamAScore}
              tokens={teamATokens}
              cardsToWin={cardsToWin}
              isActive={teamAIsActive}
              align="left"
            />
            <div className="flex-1 min-h-0">
              <Timeline
                timeline={teamATimelineData}
                team="A"
                isActiveTeam={teamAIsActive}
                onPlaceSong={teamAIsActive ? handlePlaceSong : () => {}}
                isDragActive={teamAIsActive ? isDragActive : false}
                compact={!teamAIsActive}
                ghostSongId={isChallenging && lastPlacedTeam === 'A' ? lastPlacedSong?.spotifyId : undefined}
                hiddenSongId={lastPlacedTeam === 'A' ? hiddenSongId : undefined}
              />
            </div>
          </section>

          {/* CENTER COLUMN: Action Zone */}
          <section className="col-span-12 md:col-span-6 flex flex-col items-center gap-10 relative">
            {isChallenging ? (
              /* Challenge-placing: show challenger's card */
              <>
                <TurnIndicator
                  currentTeam={challengingTeam}
                  timeRemaining={undefined}
                  isTimerRunning={false}
                />
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Place on Team {lastPlacedTeam}&apos;s timeline
                  </p>
                  {lastPlacedSong && (
                    <DraggableSongCard song={lastPlacedSong} team={challengingTeam} />
                  )}
                </div>
              </>
            ) : (
              /* Normal playing: show turn indicator + audio/card */
              <>
                <TurnIndicator
                  currentTeam={currentTeam}
                  timeRemaining={
                    phase === 'playing' && settings.turnTimeLimitSeconds > 0
                      ? turnTimer.timeRemaining
                      : undefined
                  }
                  isTimerRunning={turnTimer.isRunning}
                />
                <div className="flex flex-col items-center gap-10">
                  {showDraggableCard ? (
                    <motion.div
                      className="flex flex-col items-center gap-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    >
                      <DraggableSongCard song={currentSong} team={currentTeam} />
                      {canSkipReady && (
                        <button
                          onClick={handleSkip}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border ${
                            currentTeam === 'A'
                              ? 'border-primary/20 text-primary/70 hover:bg-primary/10'
                              : 'border-secondary/20 text-secondary/70 hover:bg-secondary/10'
                          }`}
                          style={{ background: 'rgba(49, 52, 66, 0.4)' }}
                        >
                          <span className="material-symbols-outlined text-sm">skip_next</span>
                          Skip (1 token)
                        </button>
                      )}
                    </motion.div>
                  ) : (
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
                  )}
                </div>
              </>
            )}
          </section>

          {/* RIGHT COLUMN: Team B */}
          <section className="col-span-12 md:col-span-3 flex flex-col gap-2 min-h-0">
            <TeamPanel
              label="Team B"
              team="B"
              score={teamBScore}
              tokens={teamBTokens}
              cardsToWin={cardsToWin}
              isActive={teamBIsActive}
              align="right"
            />
            <div className="flex-1 min-h-0">
              <Timeline
                timeline={teamBTimelineData}
                team="B"
                isActiveTeam={teamBIsActive}
                onPlaceSong={teamBIsActive ? handlePlaceSong : () => {}}
                isDragActive={teamBIsActive ? isDragActive : false}
                compact={!teamBIsActive}
                ghostSongId={isChallenging && lastPlacedTeam === 'B' ? lastPlacedSong?.spotifyId : undefined}
                hiddenSongId={lastPlacedTeam === 'B' ? hiddenSongId : undefined}
              />
            </div>
          </section>
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

      {/* ── Modal: Guess commit (before reveal) ────────── */}
      <GuessModal
        isOpen={phase === 'guess-commit'}
        mode="commit"
        placingTeam={placementResult?.placingTeam ?? null}
        onYes={handleGuessCommitYes}
        onNo={handleGuessCommitNo}
      />

      {/* ── Modal: Guess verify (after reveal) ───────────── */}
      <GuessModal
        isOpen={phase === 'guess-verify'}
        mode="verify"
        placingTeam={placementResult?.placingTeam ?? null}
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
      />

      {/* ── Modal: Pass-and-play interstitial ───────────── */}
      <AnimatePresence>
        {phase === 'pass-device' && !winner && (
          <PassAndPlayInterstitial
            team={currentTeam}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
