'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

interface AudioPlayerProps {
  previewUrl: string | null;
  albumArtUrl: string;
  title: string;
  artist: string;
  revealed?: boolean;
  clipDuration?: number;
  onClipEnd?: () => void;
}

export default function AudioPlayer({
  previewUrl,
  albumArtUrl,
  title,
  artist,
  revealed = false,
  clipDuration = 15,
  onClipEnd,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const disabled = !previewUrl;

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setElapsed(0);
  }, []);

  // Cleanup on unmount or URL change
  useEffect(() => {
    return cleanup;
  }, [previewUrl, cleanup]);

  const updateProgress = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    const pct = Math.min(elapsedSec / clipDuration, 1);

    setProgress(pct);
    setElapsed(elapsedSec);

    if (pct >= 1) {
      // Clip duration reached
      howlRef.current?.stop();
      setIsPlaying(false);
      setProgress(1);
      onClipEnd?.();
      return;
    }

    rafRef.current = requestAnimationFrame(updateProgress);
  }, [clipDuration, onClipEnd]);

  const togglePlay = useCallback(() => {
    if (disabled) return;

    if (isPlaying) {
      howlRef.current?.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
      return;
    }

    // If there's an existing howl that was paused, resume
    if (howlRef.current && progress > 0 && progress < 1) {
      howlRef.current.play();
      startTimeRef.current = Date.now() - elapsed * 1000;
      rafRef.current = requestAnimationFrame(updateProgress);
      setIsPlaying(true);
      return;
    }

    // Create new howl
    cleanup();

    const howl = new Howl({
      src: [previewUrl!],
      html5: true,
      volume: 0.8,
      onend: () => {
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        onClipEnd?.();
      },
      onloaderror: () => {
        setIsPlaying(false);
      },
      onplayerror: () => {
        setIsPlaying(false);
      },
    });

    howlRef.current = howl;
    howl.play();
    startTimeRef.current = Date.now();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [disabled, isPlaying, progress, elapsed, previewUrl, cleanup, updateProgress, onClipEnd]);

  // SVG circle values
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Player disc */}
      <div className="relative" style={{ width: 160, height: 160 }}>
        {/* Blurred album art background */}
        <div
          className="absolute -inset-4 rounded-full bg-cover bg-center opacity-40"
          style={{
            backgroundImage: `url(${albumArtUrl})`,
            filter: 'blur(20px)',
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
          {/* Progress ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#00d4aa"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(0, 212, 170, 0.5))',
            }}
          />
        </svg>

        {/* Album art center */}
        <div className="absolute inset-3 overflow-hidden rounded-full">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${albumArtUrl})` }}
          />
          {/* Dark overlay when not revealed */}
          {!revealed && (
            <div className="absolute inset-0 bg-black/30" />
          )}
        </div>

        {/* Play/Pause button */}
        <motion.button
          className="absolute inset-0 flex items-center justify-center rounded-full"
          onClick={togglePlay}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.03 } : undefined}
          whileTap={!disabled ? { scale: 0.97 } : undefined}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <motion.div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 48,
              height: 48,
              background: disabled
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: disabled
                ? '1.5px solid rgba(255,255,255,0.1)'
                : '1.5px solid rgba(255,255,255,0.2)',
            }}
            whileHover={!disabled ? { background: 'rgba(0,0,0,0.7)' } : undefined}
          >
            {disabled ? (
              /* Disabled / no preview icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <line x1="4" y1="4" x2="20" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="4" x2="4" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : isPlaying ? (
              /* Pause icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              /* Play icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
              </svg>
            )}
          </motion.div>
        </motion.button>

        {/* Pulsing ring while playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(0, 212, 170, 0.3)',
              }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              exit={{ opacity: 0, scale: 1.1 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Time display */}
      <div className="text-center">
        <span className="text-xs font-mono text-white/40">
          {Math.floor(elapsed)}s / {clipDuration}s
        </span>
      </div>

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

      {/* Disabled message */}
      {disabled && (
        <p className="text-xs text-white/30">No preview available</p>
      )}
    </div>
  );
}
