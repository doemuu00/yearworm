'use client';

import { useCallback } from 'react';
import type { GameSettings } from '@/lib/game/types';

interface GameSettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

const CLIP_DURATION_OPTIONS = [
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 20, label: '20 seconds' },
  { value: 30, label: '30 seconds' },
];

const TURN_TIME_OPTIONS = [
  { value: 30, label: '30 seconds' },
  { value: 45, label: '45 seconds' },
  { value: 60, label: '60 seconds' },
  { value: 90, label: '90 seconds' },
  { value: 0, label: 'No Limit' },
];

export default function GameSettingsPanel({ settings, onSettingsChange }: GameSettingsProps) {
  const update = useCallback(
    (patch: Partial<GameSettings>) => {
      onSettingsChange({ ...settings, ...patch });
    },
    [settings, onSettingsChange],
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Cards to Win */}
      <SettingRow
        label="Cards to Win"
        description="Number of correctly placed songs needed to win the game"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ cardsToWin: Math.max(3, settings.cardsToWin - 1) })}
            disabled={settings.cardsToWin <= 3}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/70
                       hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center text-lg font-bold"
            aria-label="Decrease cards to win"
          >
            &minus;
          </button>
          <span className="text-2xl font-bold text-white tabular-nums w-10 text-center">
            {settings.cardsToWin}
          </span>
          <button
            type="button"
            onClick={() => update({ cardsToWin: Math.min(20, settings.cardsToWin + 1) })}
            disabled={settings.cardsToWin >= 20}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/70
                       hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center text-lg font-bold"
            aria-label="Increase cards to win"
          >
            +
          </button>
        </div>
      </SettingRow>

      {/* Clip Duration */}
      <SettingRow
        label="Clip Duration"
        description="How long each song preview plays before the team must guess"
      >
        <div className="grid grid-cols-4 gap-1.5">
          {CLIP_DURATION_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              selected={settings.clipDurationSeconds === opt.value}
              onClick={() => update({ clipDurationSeconds: opt.value })}
            >
              {opt.value}s
            </OptionChip>
          ))}
        </div>
      </SettingRow>

      {/* Turn Time Limit */}
      <SettingRow
        label="Turn Time Limit"
        description="Maximum time a team has to place their song on the timeline"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {TURN_TIME_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              selected={settings.turnTimeLimitSeconds === opt.value}
              onClick={() => update({ turnTimeLimitSeconds: opt.value })}
            >
              {opt.value === 0 ? 'None' : `${opt.value}s`}
            </OptionChip>
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

// --- Sub-components ---

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white">{label}</h4>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function OptionChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
        selected
          ? 'bg-[#00d4aa] text-[#0a0e1a] shadow-md shadow-[#00d4aa]/20'
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
