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
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${borderClass} ${bgClass} ${
        !isActive ? 'opacity-60' : ''
      }`}
      style={{
        background: 'rgba(49, 52, 66, 0.3)',
      }}
    >
      <h2 className={labelClass}>{label}</h2>
      <span className="font-headline font-black text-sm leading-none flex items-baseline gap-0">
        <motion.span
          key={score}
          className={scoreColor}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {score}
        </motion.span>
        <span className={targetColor}>/{cardsToWin}</span>
      </span>
      <TokenDisplay tokens={tokens} team={team} />
    </div>
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
