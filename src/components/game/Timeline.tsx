'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlacedSong, Team } from '@/lib/game/types';

/* ── Props ──────────────────────────────────────────────── */

export interface TimelineProps {
  timeline: PlacedSong[];
  team: Team;
  isActiveTeam: boolean;
  onPlaceSong: (position: number) => void;
  isDragActive: boolean;
}

/* ── Team colour helpers ────────────────────────────────── */

const teamColor = (team: Team) =>
  team === 'A' ? '#00d4aa' : '#8b5cf6';

const teamColorRgb = (team: Team) =>
  team === 'A' ? '0, 212, 170' : '139, 92, 246';

/* ── Drop Zone ──────────────────────────────────────────── */

interface DropZoneProps {
  id: string;
  isActive: boolean;
}

function DropZone({ id, isActive }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className="flex items-center justify-center shrink-0 transition-all duration-200"
      style={{
        width: isOver ? 48 : 8,
        minHeight: 120,
        borderRadius: 8,
        background: isOver
          ? 'rgba(0, 212, 170, 0.15)'
          : 'rgba(255, 255, 255, 0.03)',
        border: isOver
          ? '2px dashed #00d4aa'
          : '2px dashed transparent',
        boxShadow: isOver
          ? '0 0 16px rgba(0, 212, 170, 0.3)'
          : 'none',
      }}
    >
      <AnimatePresence>
        {isOver && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="text-[#00d4aa] text-lg font-bold select-none"
          >
            +
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Placed Card ────────────────────────────────────────── */

interface PlacedCardProps {
  song: PlacedSong;
  team: Team;
  index: number;
}

function PlacedCard({ song, team, index }: PlacedCardProps) {
  const color = teamColor(team);
  const rgb = teamColorRgb(team);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.03 }}
      className="shrink-0 flex flex-col items-center gap-1"
    >
      {/* Card */}
      <div
        className="relative w-[100px] h-[100px] rounded-xl overflow-hidden"
        style={{
          border: `2px solid ${color}`,
          boxShadow: `0 0 12px rgba(${rgb}, 0.2)`,
        }}
      >
        {/* Album art */}
        {song.albumArtUrl ? (
          <img
            src={song.albumArtUrl}
            alt={song.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
        )}

        {/* Dark overlay with text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-1.5">
          <p className="text-[10px] font-semibold text-white leading-tight truncate">
            {song.title}
          </p>
          <p className="text-[9px] text-white/60 leading-tight truncate">
            {song.artist}
          </p>
        </div>

        {/* Correctness indicator */}
        {song.placedCorrectly !== undefined && (
          <div
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
            style={{
              background: song.placedCorrectly
                ? 'rgba(0, 212, 170, 0.9)'
                : 'rgba(239, 68, 68, 0.9)',
            }}
          >
            {song.placedCorrectly ? '✓' : '✗'}
          </div>
        )}
      </div>

      {/* Year label */}
      <span
        className="text-xs font-mono font-bold"
        style={{ color }}
      >
        {song.releaseYear}
      </span>
    </motion.div>
  );
}

/* ── Timeline ───────────────────────────────────────────── */

export default function Timeline({
  timeline,
  team,
  isActiveTeam,
  isDragActive,
}: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.placedAtIndex - b.placedAtIndex);

  /* Empty state */
  if (sorted.length === 0 && !isDragActive) {
    return (
      <div className="glass-card flex items-center justify-center min-h-[140px] px-6">
        <p className="text-white/40 text-sm select-none">
          Drag a song here to start your timeline
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card overflow-x-auto min-h-[160px] px-4 py-4"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="flex items-center gap-0 min-w-min">
        {/* Leading drop zone */}
        <DropZone id="drop-0" isActive={isDragActive && isActiveTeam} />

        {sorted.map((song, i) => (
          <div key={song.spotifyId} className="flex items-center">
            <PlacedCard song={song} team={team} index={i} />

            {/* Trailing drop zone after each card */}
            <DropZone
              id={`drop-${i + 1}`}
              isActive={isDragActive && isActiveTeam}
            />
          </div>
        ))}

        {/* If empty but drag active, show a single drop zone */}
        {sorted.length === 0 && isDragActive && isActiveTeam && (
          <DropZone id="drop-0" isActive />
        )}
      </div>
    </div>
  );
}
