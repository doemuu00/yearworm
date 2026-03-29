'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';

interface GuessModalProps {
  isOpen: boolean;
  mode: 'commit' | 'verify';
  placingTeam: Team | null;
  teamLabel?: string;
  onYes: () => void;
  onNo: () => void;
}

export default function GuessModal({ isOpen, mode, placingTeam, teamLabel: label, onYes, onNo }: GuessModalProps) {
  const isPrimary = placingTeam === 'A';
  const teamLabel = label || `Team ${placingTeam}`;
  const accentClass = isPrimary ? 'text-primary' : 'text-secondary';
  const btnAccentClass = isPrimary
    ? 'bg-primary text-on-primary hover:bg-primary/90'
    : 'bg-secondary text-on-secondary hover:bg-secondary/90';

  const title = mode === 'commit'
    ? 'Artist & Song Guess'
    : 'Verify Guess';

  const question = mode === 'commit'
    ? `Did ${teamLabel} correctly guess both the artist name and the song title?`
    : `Was ${teamLabel}'s guess of the artist and song correct?`;

  const icon = mode === 'commit' ? 'music_note' : 'fact_check';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative glass-panel rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isPrimary ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                <span
                  className={`material-symbols-outlined ${accentClass} text-3xl`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
              </div>
            </div>

            {/* Title */}
            <h3 className={`text-center font-headline font-bold text-lg ${accentClass} mb-2`}>
              {title}
            </h3>

            {/* Question */}
            <p className="text-center text-on-surface/80 text-sm mb-6">
              {question}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onNo}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 border border-white/10 text-on-surface/70"
                style={{ background: 'rgba(49, 52, 66, 0.6)' }}
              >
                No
              </button>
              <button
                onClick={onYes}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 ${btnAccentClass}`}
              >
                {mode === 'commit' ? 'Yes, we did' : 'Yes, correct!'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
