"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";

interface UseAudioReturn {
  play: (url: string) => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
}

/**
 * Audio playback hook wrapping Howler.js.
 * Uses html5 mode for mobile Safari compatibility.
 */
export function useAudio(): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const updateProgress = useCallback(() => {
    const howl = howlRef.current;
    if (!howl || !howl.playing()) {
      return;
    }

    const seek = howl.seek() as number;
    const dur = howl.duration() as number;

    setCurrentTime(seek);
    setDuration(dur);
    setProgress(dur > 0 ? seek / dur : 0);

    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const stop = useCallback(() => {
    cancelRaf();
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    currentUrlRef.current = null;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setCurrentTime(0);
  }, [cancelRaf]);

  const pause = useCallback(() => {
    cancelRaf();
    if (howlRef.current) {
      howlRef.current.pause();
    }
    setIsPlaying(false);
  }, [cancelRaf]);

  const play = useCallback(
    (url: string) => {
      // If same URL and howl exists, resume
      if (
        currentUrlRef.current === url &&
        howlRef.current &&
        !howlRef.current.playing()
      ) {
        howlRef.current.play();
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(updateProgress);
        return;
      }

      // Different URL or no howl — stop old and create new
      stop();

      const howl = new Howl({
        src: [url],
        html5: true,
        volume: 0.8,
        onplay: () => {
          setIsPlaying(true);
          setDuration(howl.duration() as number);
          rafRef.current = requestAnimationFrame(updateProgress);
        },
        onpause: () => {
          setIsPlaying(false);
          cancelRaf();
        },
        onstop: () => {
          setIsPlaying(false);
          cancelRaf();
        },
        onend: () => {
          setIsPlaying(false);
          setProgress(1);
          cancelRaf();
        },
        onloaderror: () => {
          setIsPlaying(false);
          cancelRaf();
        },
        onplayerror: () => {
          setIsPlaying(false);
          cancelRaf();
        },
      });

      howlRef.current = howl;
      currentUrlRef.current = url;
      howl.play();
    },
    [stop, cancelRaf, updateProgress]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRaf();
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, [cancelRaf]);

  return {
    play,
    pause,
    stop,
    isPlaying,
    progress,
    duration,
    currentTime,
  };
}
