'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';

interface TurnIndicatorProps {
  currentTeam: Team;
  teamLabel?: string;
  timeRemaining?: number;
  isTimerRunning?: boolean;
}

export default function TurnIndicator({
  currentTeam,
  teamLabel,
  timeRemaining,
  isTimerRunning = false,
}: TurnIndicatorProps) {
  const isPrimary = currentTeam === 'A';
  const colorClass = isPrimary ? 'text-primary' : 'text-secondary';
  const glowClass = isPrimary ? 'vibe-glow' : 'glow-secondary';
  const name = teamLabel || (isPrimary ? 'Team A' : 'Team B');
  const turnLabel = `${name}'s Turn`.toUpperCase();
  const isLow = timeRemaining !== undefined && timeRemaining <= 5;

  return (
    <div className="text-center py-2">
      {/* Turn headline */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentTeam}
          className={`font-headline font-black tracking-tighter text-3xl md:text-5xl ${colorClass} ${glowClass} uppercase italic`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          {turnLabel}
        </motion.h1>
      </AnimatePresence>

      {/* Timer */}
      {timeRemaining !== undefined && (
        <motion.div
          className="mt-2 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{
              color: isLow ? '#ef4444' : 'var(--color-on-surface-variant)',
            }}
          >
            timer
          </span>

          <motion.span
            className="font-mono text-sm font-bold"
            style={{
              color: isLow ? '#ef4444' : 'var(--color-on-surface-variant)',
              textShadow: isLow ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
            }}
            animate={
              isLow && isTimerRunning
                ? { scale: [1, 1.15, 1] }
                : { scale: 1 }
            }
            transition={
              isLow
                ? { duration: 0.5, repeat: Infinity }
                : undefined
            }
          >
            {Math.ceil(timeRemaining)}s
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}
