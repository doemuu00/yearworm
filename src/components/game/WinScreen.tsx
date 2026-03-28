'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';

interface WinScreenProps {
  winner: Team;
  teamAScore: number;
  teamBScore: number;
  cardsToWin: number;
  onPlayAgain: () => void;
}

/* Simple confetti particle */
interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

function generateParticles(color: string, count = 40): Particle[] {
  const colors = [
    color,
    DESIGN_TOKENS.colors.gold,
    '#ffffff',
    color,
    color,
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

export default function WinScreen({
  winner,
  teamAScore,
  teamBScore,
  cardsToWin,
  onPlayAgain,
}: WinScreenProps) {
  const color =
    winner === 'A'
      ? DESIGN_TOKENS.colors.teamA
      : DESIGN_TOKENS.colors.teamB;
  const glowClass = winner === 'A' ? 'glow-green' : 'glow-purple';
  const loserColor =
    winner === 'A'
      ? DESIGN_TOKENS.colors.teamB
      : DESIGN_TOKENS.colors.teamA;

  const [particles] = useState(() => generateParticles(color));
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(t);
  }, []);

  const winnerScore = winner === 'A' ? teamAScore : teamBScore;
  const loserScore = winner === 'A' ? teamBScore : teamAScore;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: DESIGN_TOKENS.colors.background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Confetti particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.size > 8 ? 2 : '50%',
            opacity: 0.8,
          }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [p.rotation, p.rotation + 720],
            opacity: [0, 0.9, 0.9, 0],
            x: [0, (Math.random() - 0.5) * 80],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            ease: 'easeIn',
          }}
        />
      ))}

      {/* Radial glow behind main content */}
      <motion.div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Trophy icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
                delay: 0.1,
              }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  filter: `drop-shadow(0 0 20px ${color}88)`,
                }}
              >
                <path
                  d="M12 17c-2.5 0-4-1.5-4-4V5h8v8c0 2.5-1.5 4-4 4z"
                  fill={color}
                  opacity="0.3"
                />
                <path
                  d="M8 5V3h8v2M8 5H5v3c0 2 1.5 3 3 3M16 5h3v3c0 2-1.5 3-3 3M10 17v2h4v-2M8 21h8"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 5v8c0 2.5 1.5 4 4 4s4-1.5 4-4V5"
                  stroke={color}
                  strokeWidth="1.5"
                />
              </svg>
            </motion.div>

            {/* Winner text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.h1
                className={`text-4xl font-black tracking-tight ${glowClass}`}
                style={{ color }}
                animate={{
                  textShadow: [
                    `0 0 20px ${color}66, 0 0 40px ${color}33`,
                    `0 0 30px ${color}88, 0 0 60px ${color}44`,
                    `0 0 20px ${color}66, 0 0 40px ${color}33`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Team {winner} Wins!
              </motion.h1>
            </motion.div>

            {/* Scores card */}
            <motion.div
              className="glass-card w-full max-w-xs px-6 py-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
                Final Score
              </h3>
              <div className="flex items-center justify-between gap-4">
                {/* Winner */}
                <div className="flex-1 text-center">
                  <p
                    className="text-xs font-bold uppercase"
                    style={{ color }}
                  >
                    Team {winner}
                  </p>
                  <p
                    className="text-3xl font-black"
                    style={{ color, textShadow: `0 0 12px ${color}44` }}
                  >
                    {winnerScore}
                  </p>
                </div>

                {/* Divider */}
                <div className="text-white/20 text-xl font-light">vs</div>

                {/* Loser */}
                <div className="flex-1 text-center">
                  <p
                    className="text-xs font-bold uppercase"
                    style={{ color: loserColor }}
                  >
                    Team {winner === 'A' ? 'B' : 'A'}
                  </p>
                  <p
                    className="text-3xl font-black"
                    style={{
                      color: loserColor,
                      opacity: 0.6,
                    }}
                  >
                    {loserScore}
                  </p>
                </div>
              </div>

              {/* Progress summary */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[11px] text-white/30">
                  {cardsToWin} cards needed to win
                </p>
              </div>
            </motion.div>

            {/* Play Again button */}
            <motion.button
              className="rounded-xl px-8 py-3.5 text-base font-bold transition-colors"
              style={{
                backgroundColor: color,
                color: DESIGN_TOKENS.colors.background,
                boxShadow: `0 0 20px ${color}44, 0 4px 16px rgba(0,0,0,0.3)`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{
                scale: 1.05,
                boxShadow: `0 0 30px ${color}66, 0 4px 20px rgba(0,0,0,0.4)`,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlayAgain}
            >
              Play Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
