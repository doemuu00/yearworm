'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';

interface TokenDisplayProps {
  tokens: number;
  team: Team;
  maxTokens?: number;
}

export default function TokenDisplay({ tokens, team, maxTokens = 3 }: TokenDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Token indicators as material symbols */}
      {Array.from({ length: maxTokens }, (_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-tertiary"
          style={{
            fontSize: 14,
            fontVariationSettings: i < tokens ? "'FILL' 1" : "'FILL' 0",
            opacity: i < tokens ? 1 : 0.2,
          }}
        >
          generating_tokens
        </span>
      ))}

      {/* Animated count */}
      <AnimatePresence mode="wait">
        <motion.span
          key={tokens}
          className="text-xs font-bold font-headline text-tertiary ml-0.5"
          initial={{ scale: 1.4, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {tokens}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
