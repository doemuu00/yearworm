'use client';

import { useCallback } from 'react';
import type { GameSettings } from '@/lib/game/types';

interface GameSettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

export default function GameSettingsPanel({ settings, onSettingsChange }: GameSettingsProps) {
  const update = useCallback(
    (patch: Partial<GameSettings>) => {
      onSettingsChange({ ...settings, ...patch });
    },
    [settings, onSettingsChange],
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <SliderSetting
        label="Cards to Win"
        description="Correctly placed songs needed to win"
        value={settings.cardsToWin}
        min={3}
        max={20}
        step={1}
        formatValue={(v) => `${v}`}
        onChange={(v) => update({ cardsToWin: v })}
      />

      <SliderSetting
        label="Clip Duration"
        description="How long each song preview plays"
        value={settings.clipDurationSeconds}
        min={5}
        max={30}
        step={5}
        formatValue={(v) => `${v}s`}
        onChange={(v) => update({ clipDurationSeconds: v })}
      />

      <SliderSetting
        label="Turn Time Limit"
        description="Time to place a song (0 = no limit)"
        value={settings.turnTimeLimitSeconds}
        min={0}
        max={120}
        step={15}
        formatValue={(v) => (v === 0 ? 'None' : `${v}s`)}
        onChange={(v) => update({ turnTimeLimitSeconds: v })}
      />

      <SliderSetting
        label="Challenge Window"
        description="Time to challenge a placement (0 = no limit)"
        value={settings.challengeWindowSeconds ?? 0}
        min={0}
        max={30}
        step={5}
        formatValue={(v) => (v === 0 ? 'No Limit' : `${v}s`)}
        onChange={(v) => update({ challengeWindowSeconds: v })}
      />
    </div>
  );
}

/* ── Slider Setting ────────────────────────────────────── */

function SliderSetting({
  label,
  description,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{label}</h4>
          <p className="text-xs text-white/40 mt-0.5">{description}</p>
        </div>
        <span className="text-lg font-bold text-[#00d4aa] tabular-nums min-w-[60px] text-right">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider w-full"
        style={{
          background: `linear-gradient(to right, #00d4aa ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-white/30">{formatValue(min)}</span>
        <span className="text-[10px] text-white/30">{formatValue(max)}</span>
      </div>
    </div>
  );
}
