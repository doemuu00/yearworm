'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';

interface TurnIndicatorProps {
  currentTeam: Team;
  timeRemaining?: number;
  isTimerRunning?: boolean;
}

export default function TurnIndicator({
  currentTeam,
  timeRemaining,
  isTimerRunning = false,
}: TurnIndicatorProps) {
  const color =
    currentTeam === 'A'
      ? DESIGN_TOKENS.colors.teamA
      : DESIGN_TOKENS.colors.teamB;
  const glowClass = currentTeam === 'A' ? 'glow-green' : 'glow-purple';
  const label = currentTeam === 'A' ? "Team A's Turn" : "Team B's Turn";
  const isLow = timeRemaining !== undefined && timeRemaining <= 5;

  return (
    <motion.div
      className="glass-card flex items-center gap-3 px-4 py-2.5"
      layout
    >
      {/* Pulsing dot */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: 12, height: 12 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            boxShadow: [
              `0 0 4px ${color}88`,
              `0 0 12px ${color}cc`,
              `0 0 4px ${color}88`,
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Team label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={currentTeam}
          className={`text-sm font-bold ${glowClass}`}
          style={{ color }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          {label}
        </motion.span>
      </AnimatePresence>

      {/* Timer */}
      {timeRemaining !== undefined && (
        <motion.div
          className="ml-auto flex items-center gap-1.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Timer icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isLow ? '#ef4444' : 'rgba(255,255,255,0.4)'}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M9 2h6" />
          </svg>

          <motion.span
            className="font-mono text-sm font-bold"
            style={{
              color: isLow ? '#ef4444' : 'rgba(255,255,255,0.7)',
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
    </motion.div>
  );
}
