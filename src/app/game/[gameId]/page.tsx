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
import WinScreen from '@/components/game/WinScreen';
import PassAndPlayInterstitial from '@/components/game/PassAndPlayInterstitial';
import TopAppBar from '@/components/layout/TopAppBar';
import type { Team, PlacedSong } from '@/lib/game/types';

/* ── Phase type for local UI state ─────────────────────── */
type Phase = 'playing' | 'challenge-window' | 'challenge-placing' | 'showing-result' | 'pass-device' | 'game-over';

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragActive(false);
      const { over } = event;
      if (!over) return;
      const match = String(over.id).match(/^drop-(\d+)$/);
      if (match) {
        const position = parseInt(match[1], 10);
        handlePlaceSong(position);
      }
    },
    [handlePlaceSong],
  );

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

      setRevealed(true);
      setPlacementResult({
        song: lastPlacedSong,
        placingTeam: lastPlacedTeam,
        wasChallenged: true,
        challengeSucceeded,
        challengerCorrect,
      });
      setPhase('showing-result');
      audio.stop();
    },
    [challengePlacement, audio, lastPlacedSong, lastPlacedTeam]
  );

  const handleDismissChallenge = useCallback(() => {
    dismissChallenge();
    setRevealed(true);

    if (lastPlacedSong && lastPlacedTeam) {
      setPlacementResult({
        song: lastPlacedSong,
        placingTeam: lastPlacedTeam,
        wasChallenged: false,
      });
      setPhase('showing-result');
      audio.stop();
    } else {
      setPhase('pass-device');
      audio.stop();
    }
  }, [dismissChallenge, audio, lastPlacedSong, lastPlacedTeam]);

  const handleSkip = useCallback(() => {
    if (currentTeamTokens < (settings.tokensToSkip ?? 1)) return;

    turnTimer.stopTimer();
    audio.stop();
    skipSong();
    setSongReady(false);

    setPhase('pass-device');
  }, [currentTeamTokens, settings.tokensToSkip, turnTimer, audio, skipSong]);

  const handleResultDismiss = useCallback(() => {
    setPlacementResult(null);
    setPhase('pass-device');
  }, []);

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

  // Always Team A left, Team B right
  const teamATimelineData = currentTeam === 'A' ? currentTeamTimeline : teamATimeline;
  const teamBTimelineData = currentTeam === 'B' ? currentTeamTimeline : teamBTimeline;
  const teamAIsActive = currentTeam === 'A';
  const teamBIsActive = currentTeam === 'B';

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
              />
            </div>
          </section>

          {/* CENTER COLUMN: Action Zone */}
          <section className="col-span-12 md:col-span-6 flex flex-col items-center gap-10 relative">
            <TurnIndicator
              currentTeam={currentTeam}
              timeRemaining={
                phase === 'playing' && settings.turnTimeLimitSeconds > 0
                  ? turnTimer.timeRemaining
                  : undefined
              }
              isTimerRunning={turnTimer.isRunning}
            />

            {/* Audio Player / Mystery Card */}
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
              />
            </div>
          </section>
        </main>

        {/* Floating drag overlay that follows the cursor */}
        <DragOverlay dropAnimation={null}>
          {isDragActive && currentSong ? (
            <DragOverlayCard song={currentSong} team={currentTeam} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Challenge-placing phase: challenger places card on placer's timeline ── */}
      <AnimatePresence>
        {phase === 'challenge-placing' && lastPlacedSong && lastPlacedTeam && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-surface-container-lowest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="sticky top-0 z-30 px-4 pt-4 pb-2">
              <div className="glass-panel rounded-xl p-4 text-center border border-tertiary/20">
                <h3 className="text-lg font-bold text-on-surface">
                  Team {challengingTeam}: Place the card where you think it belongs
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Drag the card onto Team {lastPlacedTeam}&apos;s timeline
                </p>
              </div>
            </div>
            <div className="flex-1 px-4 pb-24 overflow-auto">
              <GameBoard
                activeTimeline={
                  (lastPlacedTeam === 'A' ? teamATimeline : teamBTimeline)
                    .filter((s) => s.spotifyId !== lastPlacedSong.spotifyId)
                    .map((s, i) => ({ ...s, placedAtIndex: i }))
                }
                opponentTimeline={
                  challengingTeam === 'A' ? teamBTimeline : teamATimeline
                }
                currentSong={lastPlacedSong}
                activeTeam={challengingTeam}
                onPlaceSong={handleChallengerPlace}
                songReady={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
