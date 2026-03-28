'use client';

import { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlacedSong, Team } from '@/lib/game/types';

/* ── Constants ─────────────────────────────────────────── */

const YEAR_MIN = 1915;
const YEAR_MAX = 2030;
const YEAR_RANGE = YEAR_MAX - YEAR_MIN;

// Decade markers to show on the axis
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

/* ── Team colour helpers ────────────────────────────────── */

const teamColor = (team: Team) =>
  team === 'A' ? '#00d4aa' : '#8b5cf6';

const teamColorRgb = (team: Team) =>
  team === 'A' ? '0, 212, 170' : '139, 92, 246';

/** Map a year to a percentage position on the axis */
function yearToPercent(year: number): number {
  return ((year - YEAR_MIN) / YEAR_RANGE) * 100;
}

/* ── Drop Zone ──────────────────────────────────────────── */

interface DropZoneProps {
  id: string;
  team: Team;
  leftPercent: number;
  widthPercent: number;
  compact: boolean;
}

function DropZone({ id, team, leftPercent, widthPercent, compact }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const color = teamColor(team);
  const rgb = teamColorRgb(team);
  const h = compact ? 60 : 80;

  return (
    <div
      ref={setNodeRef}
      className="absolute transition-all duration-150"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: 0,
        height: h,
        zIndex: isOver ? 10 : 5,
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center rounded-lg transition-all duration-150"
        style={{
          background: isOver
            ? `rgba(${rgb}, 0.15)`
            : `rgba(${rgb}, 0.03)`,
          border: isOver
            ? `2px dashed ${color}`
            : '2px dashed rgba(255,255,255,0.08)',
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
    </div>
  );
}

/* ── Placed Card ────────────────────────────────────────── */

interface PlacedCardProps {
  song: PlacedSong;
  team: Team;
  index: number;
  compact: boolean;
  leftPercent: number;
}

function PlacedCard({ song, team, index, compact, leftPercent }: PlacedCardProps) {
  const color = teamColor(team);
  const rgb = teamColorRgb(team);
  const cardW = compact ? 48 : 68;
  const cardH = compact ? 60 : 80;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.04 }}
      className="absolute flex flex-col items-center"
      style={{
        left: `${leftPercent}%`,
        transform: `translateX(-${cardW / 2}px)`,
        top: 0,
        zIndex: 10 + index,
      }}
    >
      {/* Card */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: cardW,
          height: cardH,
          border: `2px solid ${color}`,
          boxShadow: `0 0 10px rgba(${rgb}, 0.25)`,
        }}
      >
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-1">
          <p className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-semibold text-white leading-tight truncate`}>
            {song.title}
          </p>
          {!compact && (
            <p className="text-[8px] text-white/60 leading-tight truncate">
              {song.artist}
            </p>
          )}
        </div>

        {song.placedCorrectly !== undefined && (
          <div
            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px]"
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

      {/* Connector line from card to axis */}
      <div
        style={{
          width: 2,
          height: compact ? 6 : 8,
          background: `rgba(${rgb}, 0.5)`,
        }}
      />

      {/* Node dot on the axis */}
      <div
        style={{
          width: compact ? 6 : 8,
          height: compact ? 6 : 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px rgba(${rgb}, 0.6)`,
        }}
      />

      {/* Year label below axis */}
      <span
        className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-mono font-bold mt-0.5`}
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
  compact = false,
}: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.releaseYear - b.releaseYear);
  const color = teamColor(team);
  const rgb = teamColorRgb(team);
  const showDropZones = isDragActive && isActiveTeam;

  const cardH = compact ? 60 : 80;
  const connectorH = compact ? 6 : 8;
  const dotH = compact ? 6 : 8;
  const axisTop = cardH + connectorH + dotH / 2; // where the axis line sits
  const totalH = axisTop + dotH / 2 + 4 + 16 + 8; // + year label + padding

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show latest placed card
  useEffect(() => {
    if (sorted.length > 0 && scrollRef.current) {
      const lastYear = sorted[sorted.length - 1].releaseYear;
      const pct = yearToPercent(lastYear) / 100;
      const scrollTarget = scrollRef.current.scrollWidth * pct - scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [sorted.length, sorted]);

  /* Wrapper classes for opponent (greyed out + locked) */
  const wrapperClasses = isActiveTeam
    ? ''
    : 'opacity-40 grayscale pointer-events-none';

  // Build drop zones between cards (and at edges)
  const dropZones: { id: string; leftPct: number; widthPct: number }[] = [];
  if (showDropZones && sorted.length > 0) {
    // Zone before first card
    const firstPct = yearToPercent(sorted[0].releaseYear);
    if (firstPct > 1) {
      dropZones.push({ id: 'drop-0', leftPct: 0, widthPct: firstPct });
    }
    // Zones between cards
    for (let i = 0; i < sorted.length - 1; i++) {
      const leftPct = yearToPercent(sorted[i].releaseYear);
      const rightPct = yearToPercent(sorted[i + 1].releaseYear);
      const gap = rightPct - leftPct;
      if (gap > 1) {
        dropZones.push({
          id: `drop-${i + 1}`,
          leftPct: leftPct + 1,
          widthPct: gap - 2,
        });
      }
    }
    // Zone after last card
    const lastPct = yearToPercent(sorted[sorted.length - 1].releaseYear);
    if (lastPct < 99) {
      dropZones.push({
        id: `drop-${sorted.length}`,
        leftPct: lastPct + 1,
        widthPct: 99 - lastPct,
      });
    }
  } else if (showDropZones && sorted.length === 0) {
    dropZones.push({ id: 'drop-0', leftPct: 0, widthPct: 100 });
  }

  return (
    <div className={`relative ${wrapperClasses}`}>
      <div
        ref={scrollRef}
        className="glass-card overflow-x-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div
          className="relative"
          style={{
            minWidth: compact ? 600 : 900,
            height: totalH,
            padding: `0 ${compact ? 12 : 20}px`,
          }}
        >
          {/* ── Axis line ──────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              left: compact ? 12 : 20,
              right: compact ? 12 : 20,
              top: axisTop,
              height: 2,
              background: `linear-gradient(90deg, transparent, rgba(${rgb}, 0.3) 5%, rgba(${rgb}, 0.3) 95%, transparent)`,
              boxShadow: `0 0 6px rgba(${rgb}, 0.1)`,
            }}
          />

          {/* ── Decade markers ─────────────────────────── */}
          {DECADES.map((decade) => {
            const pct = yearToPercent(decade);
            return (
              <div
                key={decade}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${pct}%`,
                  top: axisTop - 4,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Tick mark */}
                <div
                  style={{
                    width: 1,
                    height: 10,
                    background: `rgba(${rgb}, 0.15)`,
                  }}
                />
                {/* Decade label */}
                <span
                  className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-mono mt-0.5 select-none`}
                  style={{ color: `rgba(${rgb}, 0.25)` }}
                >
                  {decade}
                </span>
              </div>
            );
          })}

          {/* ── Drop zones ─────────────────────────────── */}
          {dropZones.map((dz) => (
            <DropZone
              key={dz.id}
              id={dz.id}
              team={team}
              leftPercent={dz.leftPct}
              widthPercent={dz.widthPct}
              compact={compact}
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
              leftPercent={yearToPercent(song.releaseYear)}
            />
          ))}

          {/* ── Empty state ─────────────────────────────── */}
          {sorted.length === 0 && !showDropZones && (
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <p className="text-white/30 text-sm select-none">
                {isActiveTeam ? 'Listen & place songs on the timeline' : 'Opponent timeline'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lock overlay for opponent */}
      {!isActiveTeam && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
          <span className="text-white/20 text-xs uppercase tracking-widest font-semibold bg-black/30 px-3 py-1 rounded-full">
            Locked
          </span>
        </div>
      )}
    </div>
  );
}
