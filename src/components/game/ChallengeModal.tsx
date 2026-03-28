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
}

export default function ChallengeModal({
  isOpen,
  challengingTeam,
  placingTeam,
  canChallenge,
  onChallenge,
  onDismiss,
}: ChallengeModalProps) {
  const challengeColor =
    challengingTeam === 'A'
      ? DESIGN_TOKENS.colors.teamA
      : DESIGN_TOKENS.colors.teamB;

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
            <h3 className="mb-1 text-lg font-bold text-white">
              Challenge?
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
                {canChallenge ? 'Challenge! (1 token)' : 'Not enough tokens'}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
