'use client';

import { motion } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';
import TokenDisplay from './TokenDisplay';

interface ScoreBoardProps {
  teamAScore: number;
  teamBScore: number;
  cardsToWin: number;
  currentTeam: Team;
  teamATokens: number;
  teamBTokens: number;
}

export function TeamPanel({
  label,
  team,
  score,
  tokens,
  cardsToWin,
  isActive,
  align,
}: {
  label: string;
  team: Team;
  score: number;
  tokens: number;
  cardsToWin: number;
  isActive: boolean;
  align: 'left' | 'right';
}) {
  const isPrimary = team === 'A';
  const borderClass = isPrimary ? 'border-primary/20' : 'border-secondary/20';
  const bgClass = isPrimary ? 'bg-primary/5' : 'bg-secondary/5';
  const labelClass = isPrimary
    ? 'font-headline font-bold text-primary tracking-wide text-xs uppercase'
    : 'font-headline font-bold text-secondary tracking-wide text-xs uppercase';
  const scoreColor = isPrimary ? 'text-primary' : 'text-secondary';
  const targetColor = isPrimary ? 'text-primary/40' : 'text-secondary/40';

  return (
    <motion.div
      className={`glass-panel relative flex-1 overflow-hidden rounded-xl p-4 border ${borderClass} ${bgClass} ${
        !isActive ? 'opacity-80' : ''
      }`}
      style={{
        background: 'rgba(49, 52, 66, 0.4)',
        backdropFilter: 'blur(20px)',
      }}
      animate={{
        opacity: isActive ? 1 : 0.8,
      }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="flex items-center justify-between"
        style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}
      >
        {/* Left: team info */}
        <div className="flex flex-col gap-2">
          <div>
            <h2 className={labelClass}>{label}</h2>
            <p className="text-3xl font-black font-headline text-on-surface leading-none mt-1">
              <motion.span
                key={score}
                initial={{ scale: 1.3, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {score}
              </motion.span>
              <span className={`text-xl font-bold italic ${targetColor}`}>/{cardsToWin}</span>
            </p>
          </div>
          <TokenDisplay tokens={tokens} team={team} />
        </div>
      </div>
    </motion.div>
  );
}

export default function ScoreBoard({
  teamAScore,
  teamBScore,
  cardsToWin,
  currentTeam,
  teamATokens,
  teamBTokens,
}: ScoreBoardProps) {
  return (
    <div className="flex gap-3">
      <TeamPanel
        label="Team A"
        team="A"
        score={teamAScore}
        tokens={teamATokens}
        cardsToWin={cardsToWin}
        isActive={currentTeam === 'A'}
        align="left"
      />
      <TeamPanel
        label="Team B"
        team="B"
        score={teamBScore}
        tokens={teamBTokens}
        cardsToWin={cardsToWin}
        isActive={currentTeam === 'B'}
        align="right"
      />
    </div>
  );
}
