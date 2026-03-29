'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';
import Button from '@/components/ui/Button';

interface PassAndPlayInterstitialProps {
  team: Team;
  teamLabel?: string;
  onReady: () => void;
}

export default function PassAndPlayInterstitial({
  team,
  teamLabel,
  onReady,
}: PassAndPlayInterstitialProps) {
  const color =
    team === 'A' ? DESIGN_TOKENS.colors.teamA : DESIGN_TOKENS.colors.teamB;
  const label = teamLabel || (team === 'A' ? 'Team A' : 'Team B');

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: DESIGN_TOKENS.colors.background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Radial glow */}
      <motion.div
        className="absolute"
        style={{
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }}
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      >
        {/* Hand-off icon */}
        <motion.div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 96,
            height: 96,
            backgroundColor: `${color}15`,
            border: `2px solid ${color}44`,
            boxShadow: `0 0 40px ${color}22`,
          }}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Phone / hand-off icon */}
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" />
          </svg>
        </motion.div>

        {/* Message */}
        <motion.h1
          className="text-4xl font-black tracking-tight"
          style={{
            color,
            textShadow: `0 0 24px ${color}66, 0 0 48px ${color}33`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.35 }}
        >
          {label}&apos;s Turn
        </motion.h1>

        {/* Ready button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant={team === 'A' ? 'primary' : 'secondary'}
            size="lg"
            onClick={onReady}
          >
            Ready
          </Button>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
