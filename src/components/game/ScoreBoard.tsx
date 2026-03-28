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

function TeamPanel({
  label,
  team,
  score,
  tokens,
  cardsToWin,
  isActive,
  color,
  align,
}: {
  label: string;
  team: Team;
  score: number;
  tokens: number;
  cardsToWin: number;
  isActive: boolean;
  color: string;
  align: 'left' | 'right';
}) {
  const progress = Math.min(score / cardsToWin, 1);

  return (
    <motion.div
      className="glass-card relative flex-1 overflow-hidden px-3 py-2.5"
      animate={{
        borderColor: isActive ? `${color}44` : 'rgba(255,255,255,0.08)',
        boxShadow: isActive
          ? `0 0 16px ${color}22, inset 0 0 12px ${color}08`
          : '0 0 0 transparent',
      }}
      transition={{ duration: 0.4 }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: color }}
          layoutId="activeTeamBar"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Header row */}
      <div
        className="flex items-center justify-between mb-1.5"
        style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: isActive ? color : 'rgba(255,255,255,0.5)' }}
        >
          {label}
        </span>
        <TokenDisplay tokens={tokens} team={team} />
      </div>

      {/* Score */}
      <div
        className="flex items-baseline gap-1 mb-2"
        style={{
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <motion.span
          className="text-2xl font-black"
          style={{
            color,
            textShadow: isActive ? `0 0 12px ${color}66` : 'none',
          }}
          key={score}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/30 font-medium">
          / {cardsToWin}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${color}15` }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
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
    <div className="flex gap-2">
      <TeamPanel
        label="Team A"
        team="A"
        score={teamAScore}
        tokens={teamATokens}
        cardsToWin={cardsToWin}
        isActive={currentTeam === 'A'}
        color={DESIGN_TOKENS.colors.teamA}
        align="left"
      />
      <TeamPanel
        label="Team B"
        team="B"
        score={teamBScore}
        tokens={teamBTokens}
        cardsToWin={cardsToWin}
        isActive={currentTeam === 'B'}
        color={DESIGN_TOKENS.colors.teamB}
        align="right"
      />
    </div>
  );
}
