'use client';

import { useRef, useEffect, useState as useStateReact } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ── Team colour helpers ────────────────────────────────── */

const teamColor = (team: Team) =>
  team === 'A' ? '#00d4aa' : '#8b5cf6';

const teamColorRgb = (team: Team) =>
  team === 'A' ? '0, 212, 170' : '139, 92, 246';

/** Map a year to a percentage position — newest (2030) at top (0%), oldest (1915) at bottom (100%) */
function yearToPercent(year: number): number {
  return ((YEAR_MAX - year) / YEAR_RANGE) * 100;
}

/* ── Drop Zone (vertical) ─────────────────────────────── */

interface DropZoneProps {
  id: string;
  team: Team;
  topPercent: number;
  heightPercent: number;
  compact: boolean;
}

function DropZone({ id, team, topPercent, heightPercent, compact }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const color = teamColor(team);
  const rgb = teamColorRgb(team);

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
        className="w-full h-full flex items-center justify-center rounded-lg transition-all duration-150"
        style={{
          background: isOver
            ? `rgba(${rgb}, 0.15)`
            : `rgba(${rgb}, 0.03)`,
          border: isOver
            ? `2px dashed ${color}`
            : '2px dashed rgba(255,255,255,0.06)',
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

/* ── Placed Card (vertical) ───────────────────────────── */

interface PlacedCardProps {
  song: PlacedSong;
  team: Team;
  index: number;
  compact: boolean;
  topPercent: number;
}

function PlacedCard({ song, team, index, compact, topPercent }: PlacedCardProps) {
  const color = teamColor(team);
  const rgb = teamColorRgb(team);
  const cardW = compact ? 48 : 68;
  const cardH = compact ? 36 : 44;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, x: 16 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.04 }}
      className="absolute flex items-center"
      style={{
        top: `${topPercent}%`,
        transform: `translateY(-${cardH / 2}px)`,
        left: compact ? 36 : 48,
        zIndex: 20 + index,
      }}
    >
      {/* Connector line from axis to card */}
      <div
        style={{
          width: compact ? 6 : 8,
          height: 2,
          background: `rgba(${rgb}, 0.5)`,
        }}
      />

      {/* Card */}
      <div
        className="relative rounded-lg overflow-hidden flex-shrink-0"
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

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center p-1.5">
          <div className="min-w-0">
            <p className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-semibold text-white leading-tight truncate`}>
              {song.title}
            </p>
            {!compact && (
              <p className="text-[7px] text-white/60 leading-tight truncate">
                {song.artist}
              </p>
            )}
          </div>
        </div>

        {song.placedCorrectly !== undefined && (
          <div
            className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[6px]"
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

      {/* Year label to the right of card */}
      <span
        className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-mono font-bold ml-1.5`}
        style={{ color }}
      >
        {song.releaseYear}
      </span>
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
  const color = teamColor(team);
  const rgb = teamColorRgb(team);
  const showDropZones = isDragActive && isActiveTeam;

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useStateReact(compact ? 300 : 500);

  // Measure actual container height
  useEffect(() => {
    if (innerRef.current) {
      setContainerH(innerRef.current.offsetHeight);
    }
  }, [isDragActive]);

  // Auto-scroll to show latest placed card (newest = top)
  useEffect(() => {
    if (sorted.length > 0 && scrollRef.current) {
      const newestYear = sorted[sorted.length - 1].releaseYear;
      const pct = yearToPercent(newestYear) / 100;
      const scrollTarget = scrollRef.current.scrollHeight * pct - scrollRef.current.clientHeight / 2;
      scrollRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  }, [sorted.length, sorted]);

  const wrapperClasses = isActiveTeam
    ? ''
    : 'opacity-40 grayscale pointer-events-none';

  // Card exclusion zone: convert card pixel height to percentage of container
  const cardH = compact ? 36 : 44;
  const cardExclusionPct = ((cardH / 2 + 10) / containerH) * 100;

  // Build drop zones between cards (vertical)
  const dropZones: { id: string; topPct: number; heightPct: number }[] = [];
  if (showDropZones && sorted.length > 0) {
    // Sorted by year ascending, but on screen newest is at top
    // So sorted[last] is at the top (lowest topPercent), sorted[0] at bottom

    // Zone above the newest card (top of timeline)
    const newestPct = yearToPercent(sorted[sorted.length - 1].releaseYear);
    if (newestPct - cardExclusionPct > 2) {
      dropZones.push({
        id: `drop-${sorted.length}`,
        topPct: 0,
        heightPct: newestPct - cardExclusionPct,
      });
    }

    // Zones between cards (iterate from newest to oldest on screen)
    for (let i = sorted.length - 1; i > 0; i--) {
      const upperPct = yearToPercent(sorted[i].releaseYear);
      const lowerPct = yearToPercent(sorted[i - 1].releaseYear);
      const zoneTop = upperPct + cardExclusionPct;
      const zoneBottom = lowerPct - cardExclusionPct;
      const zoneHeight = zoneBottom - zoneTop;
      if (zoneHeight > 2) {
        dropZones.push({
          id: `drop-${i}`,
          topPct: zoneTop,
          heightPct: zoneHeight,
        });
      }
    }

    // Zone below the oldest card (bottom of timeline)
    const oldestPct = yearToPercent(sorted[0].releaseYear);
    const belowStart = oldestPct + cardExclusionPct;
    if (belowStart < 98) {
      dropZones.push({
        id: 'drop-0',
        topPct: belowStart,
        heightPct: 100 - belowStart,
      });
    }
  } else if (showDropZones && sorted.length === 0) {
    dropZones.push({ id: 'drop-0', topPct: 0, heightPct: 100 });
  }

  const minH = compact ? 200 : 350;

  return (
    <div className={`relative ${wrapperClasses}`}>
      <div
        ref={scrollRef}
        className="glass-card overflow-y-auto"
        style={{ scrollBehavior: 'smooth', maxHeight: compact ? 200 : 400 }}
      >
        <div
          ref={innerRef}
          className="relative"
          style={{
            minHeight: minH,
            height: compact ? 300 : 500,
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
              background: `linear-gradient(180deg, transparent, rgba(${rgb}, 0.3) 5%, rgba(${rgb}, 0.3) 95%, transparent)`,
              boxShadow: `0 0 6px rgba(${rgb}, 0.1)`,
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
                {/* Decade label */}
                <span
                  className={`${compact ? 'text-[7px] w-6' : 'text-[8px] w-8'} font-mono text-right pr-1 select-none`}
                  style={{ color: `rgba(${rgb}, 0.25)` }}
                >
                  {decade}
                </span>
                {/* Tick mark */}
                <div
                  style={{
                    width: 8,
                    height: 1,
                    background: `rgba(${rgb}, 0.15)`,
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
              <p className="text-white/30 text-sm select-none">
                {isActiveTeam ? 'Listen & place songs' : 'Opponent timeline'}
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
