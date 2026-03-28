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
  compact?: boolean;
}

/* ── Team colour helpers ────────────────────────────────── */

const teamColor = (team: Team) =>
  team === 'A' ? '#00d4aa' : '#8b5cf6';

const teamColorRgb = (team: Team) =>
  team === 'A' ? '0, 212, 170' : '139, 92, 246';

/* ── Drop Zone ──────────────────────────────────────────── */

interface DropZoneProps {
  id: string;
  team: Team;
}

function DropZone({ id, team }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const color = teamColor(team);
  const rgb = teamColorRgb(team);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col items-center justify-center shrink-0 transition-all duration-200"
      style={{ width: isOver ? 64 : 32 }}
    >
      {/* Top: card-height spacer with dashed drop target */}
      <div
        className="flex items-center justify-center transition-all duration-200"
        style={{
          width: isOver ? 56 : 24,
          height: isOver ? 100 : 70,
          borderRadius: 10,
          background: isOver
            ? `rgba(${rgb}, 0.12)`
            : `rgba(${rgb}, 0.04)`,
          border: `2px dashed rgba(${rgb}, ${isOver ? 0.8 : 0.25})`,
          boxShadow: isOver
            ? `0 0 20px rgba(${rgb}, 0.3)`
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
              className="text-lg font-bold select-none"
              style={{ color }}
            >
              +
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: connecting line segment with node dot */}
      <div className="flex items-center justify-center" style={{ height: 20, position: 'relative' }}>
        {/* Line through */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 2,
            background: `rgba(${rgb}, 0.3)`,
          }}
        />
      </div>

      {/* Year label spacer */}
      <div style={{ height: 16 }} />
    </div>
  );
}

/* ── Placed Card ────────────────────────────────────────── */

interface PlacedCardProps {
  song: PlacedSong;
  team: Team;
  index: number;
  compact?: boolean;
}

function PlacedCard({ song, team, index, compact = false }: PlacedCardProps) {
  const color = teamColor(team);
  const rgb = teamColorRgb(team);

  const cardW = compact ? 56 : 80;
  const cardH = compact ? 70 : 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.03 }}
      className="shrink-0 flex flex-col items-center"
    >
      {/* Card */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          width: cardW,
          height: cardH,
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
            {song.placedCorrectly ? '\u2713' : '\u2717'}
          </div>
        )}
      </div>

      {/* Node dot on the connecting line */}
      <div
        className="flex items-center justify-center"
        style={{ height: 20, position: 'relative', width: '100%' }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px rgba(${rgb}, 0.6)`,
            zIndex: 1,
          }}
        />
      </div>

      {/* Year label */}
      <span
        className="text-xs font-mono font-bold"
        style={{ color, lineHeight: '16px' }}
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
  compact = false,
}: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.placedAtIndex - b.placedAtIndex);
  const color = teamColor(team);
  const rgb = teamColorRgb(team);
  const showDropZones = isDragActive && isActiveTeam;

  /* Wrapper classes for opponent (greyed out + locked) */
  const wrapperClasses = isActiveTeam
    ? ''
    : 'opacity-40 grayscale pointer-events-none';

  /* Empty state */
  if (sorted.length === 0 && !showDropZones) {
    return (
      <div className={`relative ${wrapperClasses}`}>
        <div
          className={`glass-card flex flex-col items-center justify-center gap-3 ${compact ? 'min-h-[100px]' : 'min-h-[140px]'} px-6`}
        >
          {/* Connecting line */}
          <div
            style={{
              width: 120,
              height: 2,
              background: `rgba(${rgb}, 0.3)`,
              boxShadow: `0 0 8px rgba(${rgb}, 0.15)`,
              borderRadius: 1,
              position: 'relative',
            }}
          >
            {/* Pulsing dot */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 10px rgba(${rgb}, 0.6)`,
              }}
            />
          </div>
          <p className="text-white/40 text-sm select-none">
            {isActiveTeam ? 'Place songs here' : 'Opponent timeline'}
          </p>

          {/* Lock overlay for opponent */}
          {!isActiveTeam && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/20 text-xs uppercase tracking-widest font-semibold">
                Locked
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${wrapperClasses}`}>
      <div
        className={`glass-card overflow-x-auto ${compact ? 'min-h-[110px] px-3 py-2' : 'min-h-[160px] px-4 py-3'}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex items-start min-w-min" style={{ position: 'relative' }}>
          {/* Connecting line running through all cards at the node row */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: compact ? 78 : 108,
              height: 2,
              background: `linear-gradient(90deg, transparent, rgba(${rgb}, 0.4) 10%, rgba(${rgb}, 0.4) 90%, transparent)`,
              boxShadow: `0 0 8px rgba(${rgb}, 0.15)`,
              zIndex: 0,
            }}
          />

          {/* Leading drop zone */}
          {showDropZones && <DropZone id="drop-0" team={team} />}

          {sorted.map((song, i) => (
            <div key={song.spotifyId} className="flex items-start">
              <PlacedCard song={song} team={team} index={i} compact={compact} />

              {/* Trailing drop zone after each card */}
              {showDropZones && (
                <DropZone id={`drop-${i + 1}`} team={team} />
              )}
            </div>
          ))}

          {/* If empty but drag active, show a single drop zone */}
          {sorted.length === 0 && showDropZones && (
            <DropZone id="drop-0" team={team} />
          )}
        </div>
      </div>

      {/* Lock overlay for opponent */}
      {!isActiveTeam && sorted.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
          <span className="text-white/20 text-xs uppercase tracking-widest font-semibold bg-black/30 px-3 py-1 rounded-full">
            Locked
          </span>
        </div>
      )}
    </div>
  );
}
