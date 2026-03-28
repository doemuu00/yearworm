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
import PlacementResult from '@/components/game/PlacementResult';
import WinScreen from '@/components/game/WinScreen';
import PassAndPlayInterstitial from '@/components/game/PassAndPlayInterstitial';
import Button from '@/components/ui/Button';

import type { Team, PlacedSong } from '@/lib/game/types';

/* ── Phase type for local UI state ─────────────────────── */
type Phase = 'playing' | 'challenge-window' | 'showing-result' | 'pass-device' | 'game-over';

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
    endChallengeWindow,
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
  } | null>(null);

  /* ── Audio ────────────────────────────────────────────── */
  const audio = useAudio();

  /* ── Challenge window timer ───────────────────────────── */
  const handleChallengeTimeout = useCallback(() => {
    endChallengeWindow();
    setRevealed(true);
    // Show placement result overlay instead of brief delay
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
  }, [endChallengeWindow, audio, lastPlacedSong, lastPlacedTeam]);

  const challengeTimer = useTimer({ onTimeout: handleChallengeTimeout });

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
      const cwSeconds = settings.challengeWindowSeconds ?? 0;
      if (cwSeconds > 0) {
        challengeTimer.startTimer(cwSeconds);
      }
    },
    [phase, placeSong, turnTimer, challengeTimer, audio, settings.challengeWindowSeconds]
  );

  const handleChallenge = useCallback(() => {
    challengeTimer.stopTimer();
    // Capture placement correctness before challengePlacement mutates state
    const wasPlacedCorrectly = lastPlacedSong?.placedCorrectly ?? false;
    challengePlacement();
    setRevealed(true);

    // Show placement result overlay
    if (lastPlacedSong && lastPlacedTeam) {
      setPlacementResult({
        song: lastPlacedSong,
        placingTeam: lastPlacedTeam,
        wasChallenged: true,
        challengeSucceeded: !wasPlacedCorrectly, // challenger succeeds when placement was wrong
      });
      setPhase('showing-result');
      audio.stop();
    } else {
      setPhase('pass-device');
      audio.stop();
    }
  }, [challengePlacement, challengeTimer, audio, lastPlacedSong, lastPlacedTeam]);

  const handleDismissChallenge = useCallback(() => {
    challengeTimer.stopTimer();
    endChallengeWindow();
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
  }, [endChallengeWindow, challengeTimer, audio, lastPlacedSong, lastPlacedTeam]);

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

      {/* ── Modal: Placement result overlay ───────────── */}
      <PlacementResult
        isOpen={phase === 'showing-result' && placementResult !== null}
        song={placementResult?.song ?? null}
        placingTeam={placementResult?.placingTeam ?? null}
        wasChallenged={placementResult?.wasChallenged ?? false}
        challengeSucceeded={placementResult?.challengeSucceeded}
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
