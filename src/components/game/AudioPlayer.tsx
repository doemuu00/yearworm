'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

type PlayerState = 'idle' | 'playing' | 'ready';

interface AudioPlayerProps {
  previewUrl: string | null;
  albumArtUrl: string;
  title: string;
  artist: string;
  revealed?: boolean;
  clipDuration?: number;
  onClipEnd?: () => void;
  onSongReady?: () => void;
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

  const handleTap = useCallback(() => {
    if (state === 'ready') return;

    // Demo mode: no preview URL
    if (!previewUrl) {
      if (state === 'idle') {
        setNoPreviewFlash(true);
        setTimeout(() => {
          setNoPreviewFlash(false);
          transitionToReady();
        }, 800);
      }
      return;
    }

    if (state === 'playing') {
      // Stop early -> transition to ready
      howlRef.current?.stop();
      transitionToReady();
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
  }, [state, previewUrl, cleanup, transitionToReady, updateProgress]);

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
                opacity: state === 'playing' ? 0.5 : 0.3,
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
              {state === 'playing' && (
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
                  filter: state === 'playing' ? 'blur(2px)' : 'blur(6px)',
                  transition: 'filter 0.4s ease',
                }}
              />
              {/* Dark overlay */}
              {!revealed && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      state === 'playing'
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
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                }}
              >
                {noPreviewFlash ? (
                  /* No preview flash */
                  <motion.span
                    className="text-xs font-medium text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No preview
                  </motion.span>
                ) : state === 'playing' ? (
                  /* Pause icon */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  /* Play / music note icon */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
                  </svg>
                )}
              </motion.div>

              {/* "Tap to listen" label below button (idle only) */}
              <AnimatePresence>
                {state === 'idle' && !noPreviewFlash && (
                  <motion.span
                    className="mt-2 text-xs font-medium text-white/50"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    Tap to listen
                  </motion.span>
                )}
              </AnimatePresence>
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
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: `2px solid ${teamColor}4d` }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  exit={{ opacity: 0, scale: 1.1 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time remaining (playing only) */}
      <AnimatePresence>
        {state === 'playing' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-xs font-mono text-white/40">
              {Math.ceil(timeRemaining)}s remaining
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
