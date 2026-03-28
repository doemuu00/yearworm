'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team, PlacedSong } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';

interface ChallengeModalProps {
  isOpen: boolean;
  challengingTeam: Team;
  placedSong: PlacedSong | null;
  placingTeam: Team | null;
  canChallenge: boolean;
  onChallenge: () => void;
  onDismiss: () => void;
  timeRemaining: number;
}

export default function ChallengeModal({
  isOpen,
  challengingTeam,
  placingTeam,
  canChallenge,
  onChallenge,
  onDismiss,
  timeRemaining,
}: ChallengeModalProps) {
  const challengeColor =
    challengingTeam === 'A'
      ? DESIGN_TOKENS.colors.teamA
      : DESIGN_TOKENS.colors.teamB;

  const progress = Math.max(timeRemaining / 10, 0);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className="glass-card relative z-10 w-full max-w-sm p-6 text-center shadow-2xl"
            style={{
              borderColor: canChallenge ? `${challengeColor}33` : 'rgba(255,255,255,0.08)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Countdown ring */}
            <div className="mx-auto mb-4" style={{ width: 64, height: 64 }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={timeRemaining <= 3 ? '#ef4444' : challengeColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
                  transform="rotate(-90 32 32)"
                  style={{
                    filter: `drop-shadow(0 0 4px ${
                      timeRemaining <= 3 ? 'rgba(239,68,68,0.5)' : `${challengeColor}66`
                    })`,
                  }}
                />
                <text
                  x="32"
                  y="37"
                  textAnchor="middle"
                  fill="white"
                  fontSize="18"
                  fontWeight="bold"
                  fontFamily="system-ui"
                >
                  {Math.ceil(timeRemaining)}
                </text>
              </svg>
            </div>

            <h3 className="mb-1 text-lg font-bold text-white">
              Challenge Window
            </h3>
            <p className="mb-4 text-sm text-white/50">
              {placingTeam
                ? `Team ${placingTeam} placed a song. Do you want to challenge?`
                : 'A song has been placed. Do you want to challenge?'}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <motion.button
                className="flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors"
                style={{
                  backgroundColor: canChallenge ? `${challengeColor}22` : 'rgba(255,255,255,0.05)',
                  color: canChallenge ? challengeColor : 'rgba(255,255,255,0.25)',
                  border: `1.5px solid ${canChallenge ? `${challengeColor}44` : 'rgba(255,255,255,0.08)'}`,
                  cursor: canChallenge ? 'pointer' : 'not-allowed',
                }}
                onClick={canChallenge ? onChallenge : undefined}
                whileHover={canChallenge ? { scale: 1.02, backgroundColor: `${challengeColor}33` } : undefined}
                whileTap={canChallenge ? { scale: 0.97 } : undefined}
                disabled={!canChallenge}
              >
                {canChallenge ? 'Challenge!' : 'Not enough tokens'}
              </motion.button>
              <motion.button
                className="flex-1 rounded-xl border-1.5 border-white/10 px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                onClick={onDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
              >
                Let it stand
              </motion.button>
            </div>

            {canChallenge && (
              <p className="mt-2 text-[10px] text-white/30">
                Costs 1 token to challenge
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
