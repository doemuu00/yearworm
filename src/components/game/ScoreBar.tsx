'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';
import TokenDisplay from './TokenDisplay';

interface ScoreBarProps {
  teamALabel: string;
  teamBLabel: string;
  teamAScore: number;
  teamBScore: number;
  teamATokens: number;
  teamBTokens: number;
  cardsToWin: number;
  activeTeam: Team;
  displayedTeam: Team;
  timeRemaining?: number;
  isTimerRunning: boolean;
  isChallenging: boolean;
  challengingTeamLabel?: string;
  placingTeamLabel?: string;
}

function TeamScore({
  label,
  team,
  score,
  tokens,
  cardsToWin,
  isActive,
}: {
  label: string;
  team: Team;
  score: number;
  tokens: number;
  cardsToWin: number;
  isActive: boolean;
}) {
  const isPrimary = team === 'A';
  const color = isPrimary ? DESIGN_TOKENS.colors.teamA : DESIGN_TOKENS.colors.teamB;
  const scoreColor = isPrimary ? 'text-primary' : 'text-secondary';
  const targetColor = isPrimary ? 'text-primary/40' : 'text-secondary/40';
  const borderColor = isPrimary ? 'border-primary/30' : 'border-secondary/30';
  const borderInactive = isPrimary ? 'border-primary/10' : 'border-secondary/10';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
        isActive ? borderColor : `${borderInactive} opacity-50`
      }`}
      style={{
        background: isActive ? `${color}08` : 'transparent',
      }}
    >
      {/* Team name */}
      <span
        className="text-[10px] font-bold uppercase tracking-widest shrink-0"
        style={{ color }}
      >
        {label}
      </span>

      {/* Score */}
      <span className="font-headline font-black text-sm leading-none flex items-baseline">
        <AnimatePresence mode="wait">
          <motion.span
            key={score}
            className={scoreColor}
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {score}
          </motion.span>
        </AnimatePresence>
        <span className={targetColor}>/{cardsToWin}</span>
      </span>

      {/* Tokens (compact) */}
      <TokenDisplay tokens={tokens} team={team} maxTokens={3} />
    </div>
  );
}

export default function ScoreBar({
  teamALabel,
  teamBLabel,
  teamAScore,
  teamBScore,
  teamATokens,
  teamBTokens,
  cardsToWin,
  activeTeam,
  displayedTeam,
  timeRemaining,
  isTimerRunning,
  isChallenging,
  challengingTeamLabel,
  placingTeamLabel,
}: ScoreBarProps) {
  const isLow = timeRemaining !== undefined && timeRemaining <= 5;
  const displayColor =
    displayedTeam === 'A' ? DESIGN_TOKENS.colors.teamA : DESIGN_TOKENS.colors.teamB;

  return (
    <div
      className="sticky top-16 z-40 flex items-center justify-between gap-2 px-4 py-2"
      style={{
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Team A score */}
      <TeamScore
        label={teamALabel}
        team="A"
        score={teamAScore}
        tokens={teamATokens}
        cardsToWin={cardsToWin}
        isActive={activeTeam === 'A'}
      />

      {/* Center: turn status */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        {isChallenging ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">
            {challengingTeamLabel} challenging
          </span>
        ) : (
          <AnimatePresence mode="wait">
            <motion.span
              key={displayedTeam}
              className="text-xs font-headline font-black uppercase tracking-tight"
              style={{ color: displayColor }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              {displayedTeam === 'A' ? teamALabel : teamBLabel}&apos;s Turn
            </motion.span>
          </AnimatePresence>
        )}

        {/* Timer */}
        {timeRemaining !== undefined && (
          <div className="flex items-center gap-1">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 10,
                color: isLow ? '#ef4444' : 'var(--color-on-surface-variant)',
              }}
            >
              timer
            </span>
            <motion.span
              className="font-mono text-[10px] font-bold"
              style={{
                color: isLow ? '#ef4444' : 'var(--color-on-surface-variant)',
              }}
              animate={
                isLow && isTimerRunning ? { scale: [1, 1.15, 1] } : { scale: 1 }
              }
              transition={isLow ? { duration: 0.5, repeat: Infinity } : undefined}
            >
              {Math.ceil(timeRemaining)}s
            </motion.span>
          </div>
        )}
      </div>

      {/* Team B score */}
      <TeamScore
        label={teamBLabel}
        team="B"
        score={teamBScore}
        tokens={teamBTokens}
        cardsToWin={cardsToWin}
        isActive={activeTeam === 'B'}
      />
    </div>
  );
}
