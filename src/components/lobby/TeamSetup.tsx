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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mx-auto">
      {/* Team A */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#00d4aa] shadow-md shadow-[#00d4aa]/40" />
          <h3 className="text-sm font-semibold text-[#00d4aa] uppercase tracking-wider">
            Team A
          </h3>
        </div>
        <label className="block text-xs text-white/40 mb-1.5">Team Name</label>
        <input
          type="text"
          value={teamAName}
          onChange={(e) => onTeamANameChange(e.target.value)}
          maxLength={20}
          placeholder="Team A"
          className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white text-sm
                     border border-[#00d4aa]/30 outline-none transition-all
                     focus:border-[#00d4aa]/70 focus:ring-2 focus:ring-[#00d4aa]/20
                     placeholder-white/20"
        />
      </motion.div>

      {/* Team B */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#8b5cf6] shadow-md shadow-[#8b5cf6]/40" />
          <h3 className="text-sm font-semibold text-[#8b5cf6] uppercase tracking-wider">
            Team B
          </h3>
        </div>
        <label className="block text-xs text-white/40 mb-1.5">Team Name</label>
        <input
          type="text"
          value={teamBName}
          onChange={(e) => onTeamBNameChange(e.target.value)}
          maxLength={20}
          placeholder="Team B"
          className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-white text-sm
                     border border-[#8b5cf6]/30 outline-none transition-all
                     focus:border-[#8b5cf6]/70 focus:ring-2 focus:ring-[#8b5cf6]/20
                     placeholder-white/20"
        />
      </motion.div>
    </div>
  );
}
