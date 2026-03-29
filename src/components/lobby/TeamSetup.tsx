'use client';

import { motion } from 'framer-motion';

interface TeamSetupProps {
  teamAName: string;
  teamBName: string;
  onTeamANameChange: (name: string) => void;
  onTeamBNameChange: (name: string) => void;
}

export default function TeamSetup({
  teamAName,
  teamBName,
  onTeamANameChange,
  onTeamBNameChange,
}: TeamSetupProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
      {/* Team A */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-lg p-8 border border-primary/10"
        style={{ boxShadow: '0 0 20px rgba(40,223,181,0.15)' }}
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">electric_bolt</span>
          </div>
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold text-primary">
              Team A
            </h3>
            <p className="text-on-surface-variant text-sm mt-0.5">Primary Challengers</p>
          </div>
        </div>
        <input
          type="text"
          value={teamAName}
          onChange={(e) => onTeamANameChange(e.target.value)}
          maxLength={20}
          placeholder="Team A"
          className="w-full bg-surface-container-highest border-0 rounded-md py-4 px-6 text-on-surface text-base
                     outline-none transition-all placeholder-on-surface-variant/40
                     focus:ring-2 focus:ring-primary/40"
        />
      </motion.div>

      {/* Team B */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-lg p-8 border border-secondary/10"
        style={{ boxShadow: '0 0 20px rgba(208,188,255,0.15)' }}
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-3xl">auto_awesome</span>
          </div>
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold text-secondary">
              Team B
            </h3>
            <p className="text-on-surface-variant text-sm mt-0.5">Sonic Rivals</p>
          </div>
        </div>
        <input
          type="text"
          value={teamBName}
          onChange={(e) => onTeamBNameChange(e.target.value)}
          maxLength={20}
          placeholder="Team B"
          className="w-full bg-surface-container-highest border-0 rounded-md py-4 px-6 text-on-surface text-base
                     outline-none transition-all placeholder-on-surface-variant/40
                     focus:ring-2 focus:ring-secondary/40"
        />
      </motion.div>
    </div>
  );
}
