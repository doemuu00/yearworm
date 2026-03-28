'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import { useGame } from '@/hooks/useGame';
import { useTimer } from '@/hooks/useTimer';
import { useAudio } from '@/hooks/useAudio';

import AudioPlayer from '@/components/game/AudioPlayer';
import GameBoard from '@/components/game/GameBoard';
import TurnIndicator from '@/components/game/TurnIndicator';
import ScoreBoard from '@/components/game/ScoreBoard';
import ChallengeModal from '@/components/game/ChallengeModal';
import WinScreen from '@/components/game/WinScreen';
import PassAndPlayInterstitial from '@/components/game/PassAndPlayInterstitial';
import Button from '@/components/ui/Button';

import type { Team } from '@/lib/game/types';

/* ── Phase type for local UI state ─────────────────────── */
type Phase = 'playing' | 'challenge-window' | 'pass-device' | 'game-over';

/* ── Constants ─────────────────────────────────────────── */
const CHALLENGE_WINDOW_SECONDS = 10;

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
    endChallengeWindow,
  } = useGame();

  /* ── Local UI state ───────────────────────────────────── */
  const [phase, setPhase] = useState<Phase>('playing');
  const [revealed, setRevealed] = useState(false);
  // Track the team whose turn we're showing (to support pass-device correctly)
  const activeTeamRef = useRef<Team>(currentTeam);

  /* ── Audio ────────────────────────────────────────────── */
  const audio = useAudio();

  /* ── Challenge window timer ───────────────────────────── */
  const handleChallengeTimeout = useCallback(() => {
    endChallengeWindow();
    setRevealed(true);
    // Brief delay so players can see the result, then move to pass-device
    setTimeout(() => {
      setPhase('pass-device');
      audio.stop();
    }, 1500);
  }, [endChallengeWindow, audio]);

  const challengeTimer = useTimer({ onTimeout: handleChallengeTimeout });

  /* ── Turn timer ───────────────────────────────────────── */
  const handleTurnTimeout = useCallback(() => {
    // Auto-skip on turn timeout (no token cost — just advance turn)
    nextTurn();
    audio.stop();
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
      challengeTimer.stopTimer();
      audio.stop();
    }
  }, [winner, turnTimer, challengeTimer, audio]);

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

  /* ── Stop audio when song changes ─────────────────────── */
  useEffect(() => {
    audio.stop();
    setRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.spotifyId]);

  /* ── Handlers ─────────────────────────────────────────── */
  const handlePlaceSong = useCallback(
    (position: number) => {
      if (phase !== 'playing') return;

      turnTimer.stopTimer();
      audio.stop();
      placeSong(position);

      // Enter challenge window
      setPhase('challenge-window');
      challengeTimer.startTimer(CHALLENGE_WINDOW_SECONDS);
    },
    [phase, placeSong, turnTimer, challengeTimer, audio]
  );

  const handleChallenge = useCallback(() => {
    challengeTimer.stopTimer();
    challengePlacement();
    setRevealed(true);

    // Brief delay to show result, then pass device
    setTimeout(() => {
      setPhase('pass-device');
      audio.stop();
    }, 2000);
  }, [challengePlacement, challengeTimer, audio]);

  const handleDismissChallenge = useCallback(() => {
    challengeTimer.stopTimer();
    endChallengeWindow();
    setRevealed(true);

    // Brief delay to show result, then pass device
    setTimeout(() => {
      setPhase('pass-device');
      audio.stop();
    }, 1500);
  }, [endChallengeWindow, challengeTimer, audio]);

  const handleSkip = useCallback(() => {
    if (currentTeamTokens < (settings.tokensToSkip ?? 1)) return;

    turnTimer.stopTimer();
    audio.stop();
    skipSong();

    // Skip goes straight to pass-device (turn already advanced by skipSong)
    setPhase('pass-device');
  }, [currentTeamTokens, settings.tokensToSkip, turnTimer, audio, skipSong]);

  const handlePassDeviceReady = useCallback(() => {
    activeTeamRef.current = currentTeam;
    setRevealed(false);
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

      {/* ── Middle section: Audio player ─────────────────── */}
      <div className="flex flex-col items-center px-4 py-6">
        <AudioPlayer
          previewUrl={currentSong?.previewUrl ?? null}
          albumArtUrl={currentSong?.albumArtUrl ?? '/placeholder-album.png'}
          title={currentSong?.title ?? 'Unknown'}
          artist={currentSong?.artist ?? 'Unknown'}
          revealed={revealed}
          clipDuration={settings.clipDurationSeconds}
        />
      </div>

      {/* ── Bottom section: GameBoard ────────────────────── */}
      <div className="flex-1 px-4 pb-24">
        <GameBoard
          timeline={currentTeamTimeline}
          currentSong={phase === 'playing' ? currentSong : null}
          team={currentTeam}
          onPlaceSong={handlePlaceSong}
        />
      </div>

      {/* ── Floating: Skip button ───────────────────────── */}
      <AnimatePresence>
        {phase === 'playing' && currentSong && (
          <motion.div
            className="fixed bottom-6 left-1/2 z-20"
            style={{ transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={!canSkip}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 4l10 8-10 8V4z" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
              Skip (1 token)
            </Button>
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
        timeRemaining={challengeTimer.timeRemaining}
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
