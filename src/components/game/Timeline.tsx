'use client';

import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { PlacedSong, Team } from '@/lib/game/types';

/* ── Constants ─────────────────────────────────────────── */

const YEAR_MIN = 1915;
const YEAR_MAX = 2030;
const YEAR_RANGE = YEAR_MAX - YEAR_MIN;

const DECADES = [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

/* ── Props ──────────────────────────────────────────────── */

export interface TimelineProps {
  timeline: PlacedSong[];
  team: Team;
  isActiveTeam: boolean;
  onPlaceSong: (position: number) => void;
  isDragActive: boolean;
  compact?: boolean;
}

/** Map a year to a percentage position — newest (2030) at top (0%), oldest (1915) at bottom (100%) */
function yearToPercent(year: number): number {
  return ((YEAR_MAX - year) / YEAR_RANGE) * 100;
}

/* ── Drop Zone (Stitch style) ────────────────────────── */

interface DropZoneProps {
  id: string;
  team: Team;
  topPercent: number;
  heightPercent: number;
  compact: boolean;
  isActiveTeam: boolean;
}

function DropZone({ id, team, topPercent, heightPercent, compact, isActiveTeam }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const isPrimary = team === 'A';
  const borderColor = isPrimary ? 'border-primary/20' : 'border-secondary/20';
  const borderColorOver = isPrimary ? 'border-primary' : 'border-secondary';
  const textColor = isPrimary ? 'text-primary/40' : 'text-secondary/40';
  const bgColor = isPrimary ? 'bg-primary/[0.02]' : 'bg-secondary/[0.02]';
  const bgColorOver = isPrimary ? 'bg-primary/15' : 'bg-secondary/15';

  return (
    <div
      ref={setNodeRef}
      className="absolute transition-all duration-150"
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        left: compact ? 28 : 36,
        right: 0,
        zIndex: isOver ? 10 : 5,
      }}
    >
      <div
        className={`w-full h-full flex items-center justify-center rounded-lg transition-all duration-150 border-2 border-dashed ${
          isOver ? `${borderColorOver} ${bgColorOver}` : `${borderColor} ${bgColor}`
        }`}
        style={isOver ? {
          boxShadow: isPrimary
            ? '0 0 20px rgba(40, 223, 181, 0.3)'
            : '0 0 20px rgba(208, 188, 255, 0.3)',
        } : undefined}
      >
        <span className={`${textColor} text-[10px] font-bold uppercase tracking-widest select-none`}>
          {isActiveTeam ? (isOver ? '+' : 'Drop Here') : 'Wait Turn'}
        </span>
      </div>
    </div>
  );
}

/* ── Placed Card (Stitch glass-panel style) ──────────── */

interface PlacedCardProps {
  song: PlacedSong;
  team: Team;
  index: number;
  compact: boolean;
  topPercent: number;
}

function PlacedCard({ song, team, index, compact, topPercent }: PlacedCardProps) {
  const isPrimary = team === 'A';
  const borderColor = isPrimary ? 'border-primary/10' : 'border-secondary/10';
  const badgeBg = isPrimary ? 'bg-primary' : 'bg-secondary';
  const badgeText = isPrimary ? 'text-on-primary' : 'text-on-secondary-fixed';
  const badgeShadow = isPrimary
    ? 'shadow-[0_4px_12px_rgba(40,223,181,0.3)]'
    : 'shadow-[0_4px_12px_rgba(208,188,255,0.2)]';
  const checkColor = isPrimary ? 'text-primary' : 'text-secondary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, x: 16 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.04 }}
      className="absolute"
      style={{
        top: `${topPercent}%`,
        transform: 'translateY(-50%)',
        left: compact ? 36 : 48,
        right: 4,
        zIndex: 20 + index,
      }}
    >
      <div className={`glass-panel ${compact ? 'p-3' : 'p-5'} rounded-xl shadow-lg relative overflow-hidden border ${borderColor}`}>
        <div className="flex justify-between items-start mb-2">
          <span className={`px-3 py-1.5 ${badgeBg} ${badgeText} font-headline font-black text-sm rounded-lg ${badgeShadow} tracking-tight`}>
            {song.releaseYear}
          </span>
          {song.placedCorrectly !== undefined && (
            <span
              className={`material-symbols-outlined ${song.placedCorrectly ? checkColor : 'text-error'} text-xl`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {song.placedCorrectly ? 'check_circle' : 'cancel'}
            </span>
          )}
        </div>
        <h3 className={`font-headline font-bold text-on-surface leading-tight ${compact ? 'text-sm' : 'text-lg'} mb-0.5 truncate`}>
          {song.title}
        </h3>
        {!compact && (
          <p className="text-sm text-on-surface-variant font-medium truncate">
            {song.artist}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ── Timeline (vertical) ──────────────────────────────── */

export default function Timeline({
  timeline,
  team,
  isActiveTeam,
  isDragActive,
  compact = false,
}: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.releaseYear - b.releaseYear);
  const isPrimary = team === 'A';
  const showDropZones = isDragActive && isActiveTeam;

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const wrapperClasses = isActiveTeam
    ? ''
    : 'opacity-60 grayscale-[0.3]';

  // Build drop zones between placed cards using midpoints as boundaries.
  // Cards sit at yearToPercent(year)%. Drop zones occupy the space BETWEEN cards,
  // never overlapping a card. Boundaries are midpoints between adjacent card positions.
  const dropZones: { id: string; topPct: number; heightPct: number }[] = [];
  if (showDropZones && sorted.length > 0) {
    // sorted ascending by year. On screen: newest (last) at top (low %), oldest (first) at bottom (high %).
    // Reverse to get screen order: top-to-bottom
    const screenOrder = [...sorted].reverse(); // newest first
    const positions = screenOrder.map((s) => yearToPercent(s.releaseYear));

    // Build midpoint boundaries between each pair of adjacent cards
    const boundaries: number[] = [0]; // top edge
    for (let i = 0; i < positions.length - 1; i++) {
      boundaries.push((positions[i] + positions[i + 1]) / 2);
    }
    boundaries.push(100); // bottom edge

    // N cards create N+1 zones (above first, between each pair, below last)
    for (let i = 0; i <= positions.length; i++) {
      const top = boundaries[i];
      const bottom = boundaries[i + 1] ?? 100;
      const height = bottom - top;
      if (height > 1) {
        // Map back to sorted index: screenOrder[0] = sorted[sorted.length-1], etc.
        // drop-N means "insert at position N in the sorted array"
        const dropIndex = sorted.length - i;
        dropZones.push({
          id: `drop-${dropIndex}`,
          topPct: top,
          heightPct: height,
        });
      }
    }
  } else if (showDropZones && sorted.length === 0) {
    dropZones.push({ id: 'drop-0', topPct: 0, heightPct: 100 });
  }

  const axisColor = isPrimary
    ? 'rgba(40, 223, 181, 0.3)'
    : 'rgba(208, 188, 255, 0.3)';
  const axisGlow = isPrimary
    ? 'rgba(40, 223, 181, 0.1)'
    : 'rgba(208, 188, 255, 0.1)';
  const decadeColor = isPrimary
    ? 'rgba(40, 223, 181, 0.6)'
    : 'rgba(208, 188, 255, 0.6)';
  const tickColor = isPrimary
    ? 'rgba(40, 223, 181, 0.35)'
    : 'rgba(208, 188, 255, 0.35)';

  return (
    <div className={`relative h-full ${wrapperClasses}`}>
      <div
        ref={scrollRef}
        className="rounded-xl h-full"
      >
        <div
          ref={innerRef}
          className="relative h-full"
          style={{
            padding: `${compact ? 8 : 12}px 0`,
          }}
        >
          {/* ── Vertical axis line ─────────────────────── */}
          <div
            style={{
              position: 'absolute',
              left: compact ? 30 : 40,
              top: compact ? 8 : 12,
              bottom: compact ? 8 : 12,
              width: 2,
              background: `linear-gradient(180deg, transparent, ${axisColor} 5%, ${axisColor} 95%, transparent)`,
              boxShadow: `0 0 6px ${axisGlow}`,
            }}
          />

          {/* ── Decade markers ─────────────────────────── */}
          {DECADES.map((decade) => {
            const pct = yearToPercent(decade);
            return (
              <div
                key={decade}
                className="absolute flex items-center"
                style={{
                  top: `${pct}%`,
                  left: 0,
                  transform: 'translateY(-50%)',
                }}
              >
                <span
                  className={`${compact ? 'text-[9px] w-7' : 'text-[11px] w-9'} font-mono font-bold text-right pr-1 select-none`}
                  style={{ color: decadeColor }}
                >
                  {decade}
                </span>
                <div
                  style={{
                    width: 8,
                    height: 1,
                    background: tickColor,
                  }}
                />
              </div>
            );
          })}

          {/* ── Drop zones ─────────────────────────────── */}
          {dropZones.map((dz) => (
            <DropZone
              key={dz.id}
              id={dz.id}
              team={team}
              topPercent={dz.topPct}
              heightPercent={dz.heightPct}
              compact={compact}
              isActiveTeam={isActiveTeam}
            />
          ))}

          {/* ── Placed cards ────────────────────────────── */}
          {sorted.map((song, i) => (
            <PlacedCard
              key={song.spotifyId}
              song={song}
              team={team}
              index={i}
              compact={compact}
              topPercent={yearToPercent(song.releaseYear)}
            />
          ))}

          {/* ── Empty state ─────────────────────────────── */}
          {sorted.length === 0 && !showDropZones && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-on-surface-variant/30 text-sm select-none">
                {isActiveTeam ? 'Listen & place songs' : 'Opponent timeline'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lock overlay for opponent */}
      {!isActiveTeam && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
          <span className={`${isPrimary ? 'text-primary/20' : 'text-secondary/20'} text-xs uppercase tracking-widest font-semibold bg-black/30 px-3 py-1 rounded-full`}>
            Wait Turn
          </span>
        </div>
      )}
    </div>
  );
}
