'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team, PlacedSong } from '@/lib/game/types';

interface ChallengeModalProps {
  isOpen: boolean;
  challengingTeam: Team;
  placedSong: PlacedSong | null;
  placingTeam: Team | null;
  canChallenge: boolean;
  onChallenge: () => void;
  onDismiss: () => void;
  placingTeamLabel?: string;
  challengingTeamLabel?: string;
}

export default function ChallengeModal({
  isOpen,
  challengingTeam,
  placingTeam,
  canChallenge,
  onChallenge,
  onDismiss,
  placingTeamLabel,
  challengingTeamLabel,
}: ChallengeModalProps) {
  const placerName = placingTeamLabel || `Team ${placingTeam}`;
  const challengerName = challengingTeamLabel || `Team ${challengingTeam}`;
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
            className="glass-panel relative z-10 w-full max-w-sm rounded-2xl p-6 border border-tertiary/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 text-tertiary">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <span className="font-headline font-bold text-lg tracking-tight">
                {canChallenge ? 'Challenge? (1 token)' : 'Not enough tokens'}
              </span>
            </div>

            {placingTeam && (
              <p className="text-sm text-on-surface-variant text-center">
                {placerName} placed a song. {challengerName}, do you want to challenge?
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 py-3.5 bg-tertiary text-on-tertiary font-bold rounded-xl active:scale-95 transition-transform shadow-[0_0_20px_rgba(243,192,26,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={canChallenge ? onChallenge : undefined}
                disabled={!canChallenge}
              >
                Challenge!
              </button>
              <button
                className="flex-1 py-3.5 bg-surface-bright/40 text-on-surface font-bold rounded-xl active:scale-95 transition-transform border border-white/5"
                onClick={onDismiss}
              >
                Let it stand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
