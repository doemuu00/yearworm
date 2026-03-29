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
    <div className="w-full max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-extrabold text-on-surface">
          Fine-tune the <span className="text-primary">Vibe</span>
        </h2>
        <p className="text-on-surface-variant text-lg mt-2">
          Customize your game experience
        </p>
      </div>

      <div className="space-y-5">
        <SliderSetting
          label="Cards to Win"
          description="Correctly placed songs needed to win"
          value={settings.cardsToWin}
          min={3}
          max={20}
          step={1}
          formatValue={(v) => `${v}`}
          onChange={(v) => update({ cardsToWin: v })}
          colorClass="primary"
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
          colorClass="primary"
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
          colorClass="primary"
        />
      </div>
    </div>
  );
}

/* ── Slider Setting ────────────────────────────────────── */

const COLOR_MAP = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    slider: '#28dfb5',
    glow: 'rgba(40,223,181,0.3)',
  },
  secondary: {
    text: 'text-secondary',
    bg: 'bg-secondary/10',
    slider: '#d0bcff',
    glow: 'rgba(208,188,255,0.3)',
  },
  tertiary: {
    text: 'text-tertiary',
    bg: 'bg-tertiary/10',
    slider: '#f3c01a',
    glow: 'rgba(243,192,26,0.3)',
  },
};

function SliderSetting({
  label,
  description,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
  colorClass = 'primary',
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  onChange: (v: number) => void;
  colorClass?: 'primary' | 'secondary' | 'tertiary';
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const colors = COLOR_MAP[colorClass];

  return (
    <div className="glass-card rounded-lg p-8 border border-outline-variant/15">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xl font-display font-bold text-on-surface">{label}</h4>
          <p className="text-sm text-on-surface-variant mt-1">{description}</p>
        </div>
        <span className={`text-2xl font-display font-black ${colors.text} ${colors.bg} px-4 py-1 rounded-full tabular-nums`}>
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
          background: `linear-gradient(to right, ${colors.slider} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{formatValue(min)}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{formatValue(max)}</span>
      </div>
    </div>
  );
}
