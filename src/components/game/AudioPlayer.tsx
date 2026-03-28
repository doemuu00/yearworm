'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

type PlayerState = 'idle' | 'playing' | 'paused' | 'ready';

interface AudioPlayerProps {
  previewUrl: string | null;
  albumArtUrl: string;
  title: string;
  artist: string;
  revealed?: boolean;
  clipDuration?: number;
  onClipEnd?: () => void;
  onSongReady?: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
  teamColor?: string;
}

export default function AudioPlayer({
  previewUrl,
  albumArtUrl,
  title,
  artist,
  revealed = false,
  clipDuration = 15,
  onClipEnd,
  onSongReady,
  onSkip,
  canSkip = false,
  teamColor = '#00d4aa',
}: AudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [noPreviewFlash, setNoPreviewFlash] = useState(false);
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const songIdRef = useRef<string>('');

  // Track song identity to detect changes
  const songIdentity = `${previewUrl ?? ''}|${title}`;

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    setProgress(0);
    setElapsed(0);
  }, []);

  // Reset to idle when song changes
  useEffect(() => {
    if (songIdRef.current && songIdRef.current !== songIdentity) {
      cleanup();
      setState('idle');
      setNoPreviewFlash(false);
    }
    songIdRef.current = songIdentity;
  }, [songIdentity, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const transitionToReady = useCallback(() => {
    cleanup();
    setState('ready');
    onClipEnd?.();
    onSongReady?.();
  }, [cleanup, onClipEnd, onSongReady]);

  const updateProgress = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    const pct = Math.min(elapsedSec / clipDuration, 1);

    setProgress(pct);
    setElapsed(elapsedSec);

    if (pct >= 1) {
      howlRef.current?.stop();
      transitionToReady();
      return;
    }

    rafRef.current = requestAnimationFrame(updateProgress);
  }, [clipDuration, transitionToReady]);

  // Track elapsed time when pausing so we can resume the progress animation
  const pausedElapsedRef = useRef<number>(0);

  const handleTap = useCallback(() => {
    if (state === 'ready') return;

    // Demo mode: no preview URL — skip straight to ready
    if (!previewUrl) {
      if (state === 'idle') {
        transitionToReady();
      }
      return;
    }

    if (state === 'playing') {
      // Pause playback
      howlRef.current?.pause();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pausedElapsedRef.current = elapsed;
      setState('paused');
      return;
    }

    if (state === 'paused') {
      // Resume playback
      howlRef.current?.play();
      startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000;
      rafRef.current = requestAnimationFrame(updateProgress);
      setState('playing');
      return;
    }

    // idle -> playing
    cleanup();

    const howl = new Howl({
      src: [previewUrl],
      html5: true,
      volume: 0.8,
      onend: () => {
        transitionToReady();
      },
      onloaderror: () => {
        setState('idle');
      },
      onplayerror: () => {
        setState('idle');
      },
    });

    howlRef.current = howl;
    howl.play();
    startTimeRef.current = Date.now();
    setState('playing');
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [state, previewUrl, cleanup, transitionToReady, updateProgress, elapsed]);

  const handlePlaceNow = useCallback(() => {
    howlRef.current?.stop();
    transitionToReady();
  }, [transitionToReady]);

  // SVG circle values
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const timeRemaining = Math.max(0, clipDuration - elapsed);

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {state === 'ready' ? (
          /* ── Ready state: hidden — GameBoard shows the draggable card */
          null
        ) : (
          /* ── Idle / Playing state: circular player ──────── */
          <motion.div
            key="circle"
            layoutId="player-shape"
            className="relative"
            style={{ width: 160, height: 160 }}
            initial={{ borderRadius: 80 }}
            animate={{ borderRadius: 80 }}
          >
            {/* Blurred album art background */}
            <div
              className="absolute -inset-4 rounded-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${albumArtUrl})`,
                filter: 'blur(20px)',
                opacity: state === 'playing' || state === 'paused' ? 0.5 : 0.3,
              }}
            />

            {/* Progress ring */}
            <svg
              className="absolute inset-0"
              width="160"
              height="160"
              viewBox="0 0 120 120"
            >
              {/* Track ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
              />
              {/* Progress arc */}
              {(state === 'playing' || state === 'paused') && (
                <motion.circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={teamColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                  style={{
                    filter: `drop-shadow(0 0 4px ${teamColor}80)`,
                  }}
                />
              )}
            </svg>

            {/* Album art center */}
            <div className="absolute inset-3 overflow-hidden rounded-full">
              <div
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${albumArtUrl})`,
                  filter: state === 'playing' || state === 'paused' ? 'blur(2px)' : 'blur(6px)',
                  transition: 'filter 0.4s ease',
                }}
              />
              {/* Dark overlay */}
              {!revealed && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      state === 'playing' || state === 'paused'
                        ? 'rgba(0,0,0,0.35)'
                        : 'rgba(0,0,0,0.55)',
                    transition: 'background 0.4s ease',
                  }}
                />
              )}
            </div>

            {/* Tap target */}
            <motion.button
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
              onClick={handleTap}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ cursor: 'pointer' }}
            >
              <motion.div
                className="flex items-center justify-center rounded-full text-center"
                style={{
                  width: 72,
                  height: 72,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  border: `1.5px solid ${state === 'playing' ? `${teamColor}66` : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                <span className={`text-xs font-semibold ${state === 'playing' ? 'text-white/80' : 'text-white/60'}`}>
                  {state === 'idle' ? (previewUrl ? 'Tap to start' : 'Tap to reveal') :
                   state === 'playing' ? 'Playing...' :
                   'Paused'}
                </span>
              </motion.div>

            </motion.button>

            {/* Pulsing ring — idle: gentle invite; playing: beat pulse */}
            <AnimatePresence>
              {state === 'idle' && !noPreviewFlash && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: '2px solid rgba(255,255,255,0.15)' }}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  exit={{ opacity: 0, scale: 1.1 }}
                />
              )}
              {state === 'playing' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: `3px solid ${teamColor}80` }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 1.0,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    exit={{ opacity: 0, scale: 1.15 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: `2px solid ${teamColor}40` }}
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{
                      scale: [1, 1.25, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: 1.0,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.3,
                    }}
                    exit={{ opacity: 0, scale: 1.25 }}
                  />
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls row: pause/resume + stop + skip */}
      <AnimatePresence>
        {(state === 'playing' || state === 'paused') && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Pause / Resume */}
            <motion.button
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              onClick={handleTap}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {state === 'playing' ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                  Pause
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" /></svg>
                  Resume
                </>
              )}
            </motion.button>

            {/* Stop (place the song) */}
            <motion.button
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: `${teamColor}22`,
                color: teamColor,
                border: `1px solid ${teamColor}44`,
              }}
              onClick={handlePlaceNow}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
              Place
            </motion.button>

            {/* Skip (costs token) */}
            {onSkip && (
              <motion.button
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: canSkip ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: canSkip ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                  border: `1px solid ${canSkip ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  cursor: canSkip ? 'pointer' : 'not-allowed',
                }}
                onClick={canSkip ? onSkip : undefined}
                whileHover={canSkip ? { scale: 1.05 } : undefined}
                whileTap={canSkip ? { scale: 0.95 } : undefined}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 4l10 8-10 8V4z" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                Skip
              </motion.button>
            )}

            {/* Time remaining */}
            <span className="text-[10px] font-mono text-white/30 ml-1">
              {Math.ceil(timeRemaining)}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song info (only when revealed) */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs text-white/50">{artist}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
