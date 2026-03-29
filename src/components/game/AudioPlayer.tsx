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
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {state === 'ready' ? (
          /* ── Ready state: hidden -- GameBoard shows the draggable card */
          null
        ) : (
          /* ── Idle / Playing state: circular player with SVG progress ring ── */
          <motion.div
            key="circle"
            layoutId="player-shape"
            className="relative group"
            style={{ width: 160, height: 160 }}
            initial={{ borderRadius: 80 }}
            animate={{ borderRadius: 80 }}
          >
            {/* SVG progress ring */}
            <svg className="w-40 h-40 transform -rotate-90 absolute inset-0">
              {/* Track ring */}
              <circle
                className="text-surface-container-highest"
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
              />
              {/* Progress arc */}
              {(state === 'playing' || state === 'paused') && (
                <motion.circle
                  className="text-primary"
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    filter: 'drop-shadow(0 0 12px rgba(40,223,181,0.5))',
                  }}
                />
              )}
            </svg>

            {/* Center play button */}
            <motion.button
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-primary to-on-primary-container flex flex-col items-center justify-center text-on-primary shadow-[0_0_40px_rgba(40,223,181,0.4)] active:scale-95 transition-all duration-200"
              onClick={handleTap}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span
                className="material-symbols-outlined text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {state === 'playing' ? 'pause' : 'play_arrow'}
              </span>
              {(state === 'playing' || state === 'paused') && (
                <span className="text-[11px] font-mono font-bold -mt-1 text-on-primary/80">
                  {Math.ceil(timeRemaining)}s
                </span>
              )}
            </motion.button>

            {/* Pulsing ring -- idle */}
            <AnimatePresence>
              {state === 'idle' && !noPreviewFlash && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none border-2 border-primary/20"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  exit={{ opacity: 0, scale: 1.1 }}
                />
              )}
              {state === 'playing' && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none border-2 border-primary/40"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                  exit={{ opacity: 0, scale: 1.15 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media controls -- Stitch style: glass circles */}
      <AnimatePresence>
        {(state === 'playing' || state === 'paused') && (
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Play / Pause */}
            <motion.button
              className="w-14 h-14 rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 transition-all active:scale-90 border border-white/5"
              style={{
                background: 'rgba(49, 52, 66, 0.4)',
                backdropFilter: 'blur(20px)',
              }}
              onClick={handleTap}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={state === 'playing' ? 'Pause' : 'Resume'}
            >
              <span className="material-symbols-outlined text-2xl">
                {state === 'playing' ? 'pause' : 'play_arrow'}
              </span>
            </motion.button>

            {/* Stop / Place */}
            <motion.button
              className="w-14 h-14 rounded-full flex items-center justify-center text-on-surface hover:text-error transition-all active:scale-90 border border-white/5"
              style={{
                background: 'rgba(49, 52, 66, 0.4)',
                backdropFilter: 'blur(20px)',
              }}
              onClick={handlePlaceNow}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Stop & place song"
            >
              <span className="material-symbols-outlined text-2xl">stop</span>
            </motion.button>

            {/* Skip */}
            {onSkip && (
              <motion.button
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/5"
                style={{
                  background: 'rgba(49, 52, 66, 0.4)',
                  backdropFilter: 'blur(20px)',
                  color: canSkip ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                  opacity: canSkip ? 1 : 0.4,
                  cursor: canSkip ? 'pointer' : 'not-allowed',
                }}
                onClick={canSkip ? onSkip : undefined}
                whileHover={canSkip ? { scale: 1.1 } : undefined}
                whileTap={canSkip ? { scale: 0.9 } : undefined}
                title={canSkip ? 'Skip (1 token)' : 'Not enough tokens'}
              >
                <span className="material-symbols-outlined text-2xl">skip_next</span>
              </motion.button>
            )}

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
            <p className="text-sm font-bold font-headline text-on-surface">{title}</p>
            <p className="text-xs text-on-surface-variant">{artist}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
