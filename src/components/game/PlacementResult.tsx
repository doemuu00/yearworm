'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team, PlacedSong } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';

interface PlacementResultProps {
  isOpen: boolean;
  song: PlacedSong | null;
  placingTeam: Team | null;
  wasChallenged: boolean;
  challengeSucceeded?: boolean; // true = challenger was right (placement was wrong)
  onDismiss: () => void;
}

const teamColor = (team: Team) =>
  team === 'A' ? DESIGN_TOKENS.colors.teamA : DESIGN_TOKENS.colors.teamB;

const teamLabel = (team: Team) => `Team ${team}`;

/* ── SVG draw-on checkmark ────────────────────────────── */
function AnimatedCheckmark({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
    >
      <div
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${color}15`,
          border: `3px solid ${color}44`,
          boxShadow: `0 0 40px ${color}22`,
        }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <motion.path
            d="M14 28l10 10 18-20"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

/* ── SVG draw-on X with shake ─────────────────────────── */
function AnimatedX({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, -3, 3, 0] }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 20, delay: 0.15 },
        rotate: { duration: 0.5, delay: 0.6 },
      }}
    >
      <div
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${color}15`,
          border: `3px solid ${color}44`,
          boxShadow: `0 0 40px ${color}22`,
        }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <motion.path
            d="M16 16l24 24"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
          />
          <motion.path
            d="M40 16l-24 24"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.45, ease: 'easeOut' }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

/* ── Stagger wrapper for text lines ───────────────────── */
const staggerDelays = [0.8, 1.5, 1.8, 2.0];
const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: staggerDelays[i] ?? 0.8 + i * 0.3, duration: 0.4, ease: 'easeOut' as const },
  }),
};

export default function PlacementResult({
  isOpen,
  song,
  placingTeam,
  wasChallenged,
  challengeSucceeded,
  onDismiss,
}: PlacementResultProps) {
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

  if (!song || !placingTeam) return null;

  const isCorrect = song.placedCorrectly;
  const challengingTeam: Team = placingTeam === 'A' ? 'B' : 'A';

  // Determine scenario
  let showCheck: boolean;
  let accentColor: string;
  let headlineText: string;
  let subtitleText: string;

  if (!wasChallenged) {
    // Scenarios 1 & 2
    showCheck = isCorrect;
    accentColor = isCorrect ? '#22c55e' : '#ef4444';
    headlineText = isCorrect ? 'Correct! +1 token' : 'Wrong position!';
    subtitleText = isCorrect
      ? `${teamLabel(placingTeam)} placed it right`
      : 'The song was removed from the timeline';
  } else if (challengeSucceeded) {
    // Scenario 3: challenger was right, placement was wrong
    showCheck = false;
    accentColor = teamColor(challengingTeam);
    headlineText = 'Challenge successful!';
    subtitleText = `Card stolen by ${teamLabel(challengingTeam)}! +1 token`;
  } else {
    // Scenario 4: challenger was wrong, placement was correct
    showCheck = true;
    accentColor = teamColor(placingTeam);
    headlineText = 'Challenge failed!';
    subtitleText = `${teamLabel(placingTeam)} earns a bonus token!`;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="glass-card relative z-10 w-full max-w-sm p-8 text-center shadow-2xl"
            style={{
              borderColor: `${accentColor}33`,
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Check / X icon */}
            <div className="mb-5">
              {showCheck ? (
                <AnimatedCheckmark color={accentColor} />
              ) : (
                <AnimatedX color={accentColor} />
              )}
            </div>

            {/* Song card reveal */}
            <motion.div
              className="glass mb-5 overflow-hidden rounded-xl"
              custom={0}
              variants={staggerChild}
              initial="hidden"
              animate="visible"
            >
              {/* Album art or gradient placeholder */}
              <div className="relative h-32 w-full overflow-hidden">
                {song.albumArtUrl ? (
                  <img
                    src={song.albumArtUrl}
                    alt={song.title}
                    className="h-full w-full object-cover"
                    style={{ filter: 'brightness(0.7)' }}
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(135deg, ${teamColor(placingTeam)}44, ${DESIGN_TOKENS.colors.background})`,
                    }}
                  />
                )}
                {/* Year overlay */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 1.2,
                  }}
                >
                  <span
                    className="text-5xl font-black tracking-wider"
                    style={{
                      color: DESIGN_TOKENS.colors.gold,
                      textShadow: `0 0 20px ${DESIGN_TOKENS.colors.gold}66, 0 2px 8px rgba(0,0,0,0.8)`,
                    }}
                  >
                    {song.releaseYear}
                  </span>
                </motion.div>
              </div>

              {/* Song info */}
              <div className="px-4 py-3">
                <p className="truncate text-base font-bold text-white">
                  {song.title}
                </p>
                <p className="truncate text-sm text-white/50">{song.artist}</p>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h3
              className="mb-1 text-xl font-black"
              style={{ color: accentColor }}
              custom={1}
              variants={staggerChild}
              initial="hidden"
              animate="visible"
            >
              {headlineText}
            </motion.h3>

            {/* Subtitle */}
            <motion.p
              className="text-sm text-white/60"
              custom={2}
              variants={staggerChild}
              initial="hidden"
              animate="visible"
            >
              {subtitleText}
            </motion.p>

            {/* Team accent bar */}
            <motion.div
              className="mx-auto mt-5 h-1 w-16 rounded-full"
              style={{ backgroundColor: teamColor(placingTeam) }}
              custom={3}
              variants={staggerChild}
              initial="hidden"
              animate="visible"
            />

            {/* Continue button */}
            <motion.button
              className="mt-6 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.4, ease: 'easeOut' }}
              onClick={onDismiss}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
