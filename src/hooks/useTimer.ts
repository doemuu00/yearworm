"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseTimerOptions {
  onTimeout?: () => void;
}

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
}

/**
 * Turn timer hook with countdown and timeout callback.
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(options.onTimeout);

  // Keep callback ref up to date without causing re-renders
  useEffect(() => {
    onTimeoutRef.current = options.onTimeout;
  }, [options.onTimeout]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
  }, [clearTimerInterval]);

  const startTimer = useCallback(
    (seconds: number) => {
      clearTimerInterval();
      setTimeRemaining(seconds);
      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearTimerInterval();
            setIsRunning(false);
            onTimeoutRef.current?.();
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [clearTimerInterval]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  return {
    timeRemaining,
    isRunning,
    startTimer,
    stopTimer,
  };
}
