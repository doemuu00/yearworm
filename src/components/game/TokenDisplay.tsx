'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';

interface TokenDisplayProps {
  tokens: number;
  team: Team;
}

export default function TokenDisplay({ tokens, team }: TokenDisplayProps) {
  const teamColor =
    team === 'A'
      ? DESIGN_TOKENS.colors.teamA
      : DESIGN_TOKENS.colors.teamB;

  return (
    <div className="flex items-center gap-1.5">
      {/* Coin icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="#f59e0b"
          opacity="0.2"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="6" fill="#f59e0b" opacity="0.35" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="#f59e0b"
          fontSize="10"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          T
        </text>
      </svg>

      {/* Token count */}
      <AnimatePresence mode="wait">
        <motion.span
          key={tokens}
          className="glow-gold text-sm font-extrabold"
          style={{ color: '#f59e0b' }}
          initial={{ scale: 1.4, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {tokens}
        </motion.span>
      </AnimatePresence>

      {/* Team indicator line */}
      <div
        className="ml-0.5 h-3 w-0.5 rounded-full"
        style={{ backgroundColor: teamColor, opacity: 0.5 }}
      />
    </div>
  );
}
