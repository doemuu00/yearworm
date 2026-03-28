'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/stores/gameStore';
import { useTimer } from '@/hooks/useTimer';
import { useAudio } from '@/hooks/useAudio';

import AudioPlayer from '@/components/game/AudioPlayer';
import GameBoard from '@/components/game/GameBoard';
import TurnIndicator from '@/components/game/TurnIndicator';
import ScoreBoard from '@/components/game/ScoreBoard';
import ChallengeModal from '@/components/game/ChallengeModal';
import PlacementResult from '@/components/game/PlacementResult';
import WinScreen from '@/components/game/WinScreen';
import PassAndPlayInterstitial from '@/components/game/PassAndPlayInterstitial';
import type { Team, PlacedSong } from '@/lib/game/types';

/* ── Phase type for local UI state ─────────────────────── */
type Phase = 'playing' | 'challenge-window' | 'challenge-placing' | 'showing-result' | 'pass-device' | 'game-over';

/* ── Team color helper ─────────────────────────────────── */
const getTeamColor = (team: Team) =>
  team === 'A' ? '#00d4aa' : '#8b5cf6';

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

  /* ── (challenge timer removed — challenges are now manual) ── */

  /* ── Turn timer ───────────────────────────────────────── */
  const handleTurnTimeout = useCallback(() => {
    // Auto-skip on turn timeout (no token cost — just advance turn)
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
    // Only trigger on phase changes
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

      // Enter challenge window
      setPhase('challenge-window');
    },
    [phase, placeSong, turnTimer, audio]
  );

  const handleChallenge = useCallback(() => {
    // Transition to challenge-placing phase where challenger places the card
    setPhase('challenge-placing');
  }, []);

  const handleChallengerPlace = useCallback(
    (position: number) => {
      if (!lastPlacedSong || !lastPlacedTeam) return;

      // Capture placement correctness before challengePlacement mutates state
      const wasPlacedCorrectly = lastPlacedSong.placedCorrectly;
      challengePlacement(position);

      // Determine outcomes after the store updates
      const originalWrong = !wasPlacedCorrectly;
      // We need to read challengerCorrect from the store after the call
      // Since challengePlacement is synchronous in Zustand, we can read it
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

    // Show placement result overlay
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

    // Skip goes straight to pass-device (turn already advanced by skipSong)
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

  /* ── Guard: no song pool yet (redirecting) ─────────── */
  if (songPool.length === 0) {
    return null;
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ background: '#0a0e1a' }}
    >
      {/* ── Top section: Score + Turn indicator ──────────── */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-2 space-y-2">
        <ScoreBoard
          teamAScore={teamAScore}
          teamBScore={teamBScore}
          cardsToWin={cardsToWin}
          currentTeam={currentTeam}
          teamATokens={teamATokens}
          teamBTokens={teamBTokens}
        />
        <TurnIndicator
          currentTeam={currentTeam}
          timeRemaining={
            phase === 'playing' && settings.turnTimeLimitSeconds > 0
              ? turnTimer.timeRemaining
              : undefined
          }
          isTimerRunning={turnTimer.isRunning}
        />
      </div>

      {/* ── GameBoard with AudioPlayer between timelines ── */}
      <div className="flex-1 px-4 pb-24">
        <GameBoard
          activeTimeline={currentTeamTimeline}
          opponentTimeline={currentTeam === 'A' ? teamBTimeline : teamATimeline}
          currentSong={phase === 'playing' ? currentSong : null}
          activeTeam={currentTeam}
          onPlaceSong={handlePlaceSong}
          songReady={songReady}
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
              teamColor={getTeamColor(currentTeam)}
            />
          }
        />
      </div>


      {/* ── Challenge-placing phase: challenger places card on placer's timeline ── */}
      <AnimatePresence>
        {phase === 'challenge-placing' && lastPlacedSong && lastPlacedTeam && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#0a0e1a' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="sticky top-0 z-30 px-4 pt-4 pb-2">
              <div className="glass-card rounded-xl p-4 text-center">
                <h3 className="text-lg font-bold text-white">
                  Team {challengingTeam}: Place the card where you think it belongs
                </h3>
                <p className="text-sm text-white/50 mt-1">
                  Drag the card onto Team {lastPlacedTeam}&apos;s timeline
                </p>
              </div>
            </div>
            <div className="flex-1 px-4 pb-24 overflow-auto">
              <GameBoard
                activeTimeline={
                  // Show placer's timeline WITHOUT the challenged song
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
