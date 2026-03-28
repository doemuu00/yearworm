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
  placedSong,
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
  const placingColor = placingTeam
    ? placingTeam === 'A'
      ? DESIGN_TOKENS.colors.teamA
      : DESIGN_TOKENS.colors.teamB
    : '#888';

  const challengeResolved = placedSong && !canChallenge && timeRemaining <= 0;
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
            {/* Challenge window header */}
            {!challengeResolved ? (
              <>
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
                    ? `Team ${placingTeam} placed a song. Challenge it?`
                    : 'A song has been placed. Challenge it?'}
                </p>

                {/* Song preview */}
                {placedSong && (
                  <div className="glass mb-4 rounded-lg px-3 py-2 text-left">
                    <p className="text-xs text-white/40 mb-0.5">Placed at position {placedSong.placedAtIndex + 1}</p>
                    <p className="text-sm font-semibold text-white truncate">{placedSong.title}</p>
                    <p className="text-xs text-white/50 truncate">{placedSong.artist}</p>
                  </div>
                )}

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
                    {canChallenge ? 'Challenge!' : 'No tokens'}
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
              </>
            ) : (
              /* Challenge resolved state */
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {placedSong?.placedCorrectly ? (
                    /* Placement was correct - challenge failed */
                    <div className="mb-4">
                      <div
                        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${placingColor}22`, border: `2px solid ${placingColor}44` }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={placingColor} strokeWidth="2.5" strokeLinecap="round">
                          <path d="M5 12l5 5L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Placement Correct!
                      </h3>
                      <p className="text-sm text-white/50">
                        Challenge failed. The song was placed correctly.
                      </p>
                    </div>
                  ) : (
                    /* Placement was wrong - challenge succeeded */
                    <div className="mb-4">
                      <div
                        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${challengeColor}22`, border: `2px solid ${challengeColor}44` }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={challengeColor} strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Challenge Successful!
                      </h3>
                      <p className="text-sm text-white/50">
                        The placement was incorrect!
                      </p>
                    </div>
                  )}

                  {/* Revealed song info */}
                  {placedSong && (
                    <div className="glass rounded-lg px-4 py-3 mb-4">
                      <p className="text-sm font-semibold text-white">{placedSong.title}</p>
                      <p className="text-xs text-white/50">{placedSong.artist}</p>
                      <motion.p
                        className="glow-gold mt-1 text-lg font-black"
                        style={{ color: DESIGN_TOKENS.colors.gold }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        {placedSong.releaseYear}
                      </motion.p>
                    </div>
                  )}

                  <motion.button
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                    onClick={onDismiss}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Continue
                  </motion.button>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
