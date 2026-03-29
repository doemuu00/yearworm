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

/** Minimum gap between card centers (%) to guarantee a visible drop zone */
const MIN_CENTER_GAP_NORMAL = 15;
const MIN_CENTER_GAP_COMPACT = 11;

/* ── Props ──────────────────────────────────────────────── */

export interface TimelineProps {
  timeline: PlacedSong[];
  team: Team;
  isActiveTeam: boolean;
  onPlaceSong: (position: number) => void;
  isDragActive: boolean;
  compact?: boolean;
  /** During challenge-placing, render this song as a ghost (transparent, no drop zone impact) */
  ghostSongId?: string;
}

/** Map a year to a percentage position — newest (2030) at top (0%), oldest (1915) at bottom (100%) */
function yearToPercent(year: number): number {
  return ((YEAR_MAX - year) / YEAR_RANGE) * 100;
}

/**
 * Resolve card positions to prevent overlap.
 * Takes ideal positions (screen order: top to bottom) and enforces a minimum gap.
 * Two-pass: top-down push, then bottom-up push, then center the result.
 */
function resolvePositions(idealPositions: number[], minGap: number): number[] {
  if (idealPositions.length === 0) return [];
  if (idealPositions.length === 1) return [...idealPositions];

  const n = idealPositions.length;
  const adjusted = [...idealPositions];

  // Pass 1: top-down — push cards down if too close
  for (let i = 1; i < n; i++) {
    const minPos = adjusted[i - 1] + minGap;
    if (adjusted[i] < minPos) {
      adjusted[i] = minPos;
    }
  }

  // Pass 2: bottom-up — push cards up if they overflow past 100%
  // Clamp the last card to at most 96% (leave room for the bottom edge)
  const maxBottom = 96;
  if (adjusted[n - 1] > maxBottom) {
    adjusted[n - 1] = maxBottom;
  }
  for (let i = n - 2; i >= 0; i--) {
    const maxPos = adjusted[i + 1] - minGap;
    if (adjusted[i] > maxPos) {
      adjusted[i] = maxPos;
    }
  }

  // Clamp top card to at least 4%
  if (adjusted[0] < 4) {
    adjusted[0] = 4;
    // Re-push down after clamping top
    for (let i = 1; i < n; i++) {
      const minPos = adjusted[i - 1] + minGap;
      if (adjusted[i] < minPos) {
        adjusted[i] = minPos;
      }
    }
  }

  return adjusted;
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
  const mirror = !isPrimary; // Team B axis on right
  const borderColor = isPrimary ? 'border-primary/20' : 'border-secondary/20';
  const borderColorOver = isPrimary ? 'border-primary' : 'border-secondary';
  const textColor = isPrimary ? 'text-primary/40' : 'text-secondary/40';
  const bgColor = isPrimary ? 'bg-primary/[0.02]' : 'bg-secondary/[0.02]';
  const bgColorOver = isPrimary ? 'bg-primary/15' : 'bg-secondary/15';
  const axisOffset = compact ? 28 : 36;

  return (
    <div
      ref={setNodeRef}
      className="absolute transition-all duration-150"
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        ...(mirror ? { right: axisOffset, left: 0 } : { left: axisOffset, right: 0 }),
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

/* ── Connecting Line (card displaced from true year) ─── */

interface ConnectingLineProps {
  idealPercent: number;
  adjustedPercent: number;
  team: Team;
  compact: boolean;
}

function ConnectingLine({ idealPercent, adjustedPercent, team, compact }: ConnectingLineProps) {
  const isPrimary = team === 'A';
  const lineColor = isPrimary
    ? 'rgba(40, 223, 181, 0.35)'
    : 'rgba(208, 188, 255, 0.35)';
  const dotColor = isPrimary
    ? 'rgba(40, 223, 181, 0.6)'
    : 'rgba(208, 188, 255, 0.6)';
  const axisPos = compact ? 30 : 40;

  const topPct = Math.min(idealPercent, adjustedPercent);
  const heightPct = Math.abs(adjustedPercent - idealPercent);

  return (
    <>
      {/* Vertical line along axis from true year to adjusted position */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: `${topPct}%`,
          height: `${heightPct}%`,
          width: 2,
          ...(isPrimary ? { left: axisPos } : { right: axisPos }),
          background: lineColor,
          zIndex: 15,
        }}
      />
      {/* Dot at the true year position */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: `${idealPercent}%`,
          width: 6,
          height: 6,
          transform: 'translate(-50%, -50%)',
          ...(isPrimary ? { left: axisPos + 1 } : { right: axisPos - 1 }),
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
          zIndex: 16,
        }}
      />
    </>
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
  const mirror = !isPrimary;
  const borderColor = isPrimary ? 'border-primary/10' : 'border-secondary/10';
  const badgeBg = isPrimary ? 'bg-primary' : 'bg-secondary';
  const badgeText = isPrimary ? 'text-on-primary' : 'text-on-secondary-fixed';
  const badgeShadow = isPrimary
    ? 'shadow-[0_4px_12px_rgba(40,223,181,0.3)]'
    : 'shadow-[0_4px_12px_rgba(208,188,255,0.2)]';
  const checkColor = isPrimary ? 'text-primary' : 'text-secondary';
  const cardOffset = compact ? 36 : 48;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, x: mirror ? -16 : 16, y: '-50%' }}
      animate={{ opacity: 1, scale: 1, x: 0, y: '-50%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.04 }}
      className="absolute"
      style={{
        top: `${topPercent}%`,
        ...(mirror ? { right: cardOffset, left: 4 } : { left: cardOffset, right: 4 }),
        zIndex: 20 + index,
      }}
    >
      <div className={`glass-panel ${compact ? 'p-3' : 'p-5'} rounded-xl shadow-lg relative overflow-hidden border ${borderColor}`}>
        <div className={`flex justify-between items-start mb-2 ${mirror ? 'flex-row-reverse' : ''}`}>
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
        <h3 className={`font-headline font-bold text-on-surface leading-tight ${compact ? 'text-sm' : 'text-lg'} mb-0.5 truncate ${mirror ? 'text-right' : ''}`}>
          {song.title}
        </h3>
        {!compact && (
          <p className={`text-sm text-on-surface-variant font-medium truncate ${mirror ? 'text-right' : ''}`}>
            {song.artist}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ── Ghost Card (semi-transparent contested card) ────── */

interface GhostCardProps {
  song: PlacedSong;
  team: Team;
  compact: boolean;
  topPercent: number;
}

function GhostCard({ song, team, compact, topPercent }: GhostCardProps) {
  const isPrimary = team === 'A';
  const mirror = !isPrimary;
  const borderColor = isPrimary ? 'border-primary/10' : 'border-secondary/10';
  const badgeBg = isPrimary ? 'bg-primary' : 'bg-secondary';
  const badgeText = isPrimary ? 'text-on-primary' : 'text-on-secondary-fixed';
  const cardOffset = compact ? 36 : 48;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: '-50%' }}
      animate={{ opacity: [0.2, 0.35, 0.2], scale: 1, y: '-50%' }}
      transition={{
        opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        scale: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      className="absolute pointer-events-none"
      style={{
        top: `${topPercent}%`,
        ...(mirror ? { right: cardOffset, left: 4 } : { left: cardOffset, right: 4 }),
        zIndex: 4,
      }}
    >
      <div className={`${compact ? 'p-3' : 'p-5'} rounded-xl border-2 border-dashed relative overflow-hidden ${borderColor}`}
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className={`flex justify-between items-start mb-2 ${mirror ? 'flex-row-reverse' : ''}`}>
          <span className={`px-3 py-1.5 ${badgeBg} ${badgeText} font-headline font-black text-sm rounded-lg tracking-tight opacity-50`}>
            ?
          </span>
        </div>
        <h3 className={`font-headline font-bold text-on-surface/40 leading-tight ${compact ? 'text-sm' : 'text-lg'} mb-0.5 truncate ${mirror ? 'text-right' : ''}`}>
          {song.title}
        </h3>
        {!compact && (
          <p className={`text-sm text-on-surface-variant/30 font-medium truncate ${mirror ? 'text-right' : ''}`}>
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
  ghostSongId,
}: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.releaseYear - b.releaseYear);
  const isPrimary = team === 'A';
  const showDropZones = isDragActive && isActiveTeam;

  // Separate ghost card from solid cards for drop zone calculation
  const ghostSong = ghostSongId ? sorted.find(s => s.spotifyId === ghostSongId) : null;
  const solidSorted = ghostSongId ? sorted.filter(s => s.spotifyId !== ghostSongId) : sorted;

  // Find the drop zone index to exclude (where ghost card sits among solid cards by year)
  const excludedDropIndex = ghostSong
    ? solidSorted.filter(s => s.releaseYear <= ghostSong.releaseYear).length
    : undefined;

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const wrapperClasses = isActiveTeam
    ? ''
    : 'opacity-60 grayscale-[0.3]';

  // ── Compute adjusted positions with minimum spacing ──
  const CARD_HALF_PCT = compact ? 4.5 : 6.5;
  const MIN_GAP = compact ? MIN_CENTER_GAP_COMPACT : MIN_CENTER_GAP_NORMAL;

  // Screen order: newest first (top of screen = low %)
  const screenOrder = [...solidSorted].reverse();
  const idealPositions = screenOrder.map(s => yearToPercent(s.releaseYear));
  const adjustedPositions = resolvePositions(idealPositions, MIN_GAP);

  // Map spotifyId → adjusted position for easy lookup
  const positionMap = new Map<string, { ideal: number; adjusted: number }>();
  screenOrder.forEach((song, i) => {
    positionMap.set(song.spotifyId, {
      ideal: idealPositions[i],
      adjusted: adjustedPositions[i],
    });
  });

  // ── Build drop zones using adjusted positions ──
  const dropZones: { id: string; topPct: number; heightPct: number }[] = [];
  if (showDropZones && solidSorted.length > 0) {
    const edges = adjustedPositions.map((p) => ({
      top: Math.max(0, p - CARD_HALF_PCT),
      bottom: Math.min(100, p + CARD_HALF_PCT),
    }));

    for (let i = 0; i <= edges.length; i++) {
      const top = i === 0 ? 0 : edges[i - 1].bottom;
      const bottom = i === edges.length ? 100 : edges[i].top;
      const height = bottom - top;
      if (height > 0.5) {
        const dropIndex = solidSorted.length - i;
        // Skip the drop zone that corresponds to the ghost card's original position
        if (dropIndex === excludedDropIndex) continue;
        dropZones.push({
          id: `drop-${dropIndex}`,
          topPct: top,
          heightPct: height,
        });
      }
    }
  } else if (showDropZones && solidSorted.length === 0) {
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
              ...(isPrimary
                ? { left: compact ? 30 : 40 }
                : { right: compact ? 30 : 40 }),
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
                className={`absolute flex items-center ${isPrimary ? '' : 'flex-row-reverse'}`}
                style={{
                  top: `${pct}%`,
                  ...(isPrimary ? { left: 0 } : { right: 0 }),
                  transform: 'translateY(-50%)',
                }}
              >
                <span
                  className={`${compact ? 'text-[9px] w-7' : 'text-[11px] w-9'} font-mono font-bold ${isPrimary ? 'text-right pr-1' : 'text-left pl-1'} select-none`}
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

          {/* ── Connecting lines (displaced cards) ─────── */}
          {solidSorted.map((song) => {
            const pos = positionMap.get(song.spotifyId);
            if (!pos || Math.abs(pos.ideal - pos.adjusted) < 0.5) return null;
            return (
              <ConnectingLine
                key={`line-${song.spotifyId}`}
                idealPercent={pos.ideal}
                adjustedPercent={pos.adjusted}
                team={team}
                compact={compact}
              />
            );
          })}

          {/* ── Ghost card (contested, semi-transparent) ── */}
          {ghostSong && (
            <GhostCard
              key={`ghost-${ghostSong.spotifyId}`}
              song={ghostSong}
              team={team}
              compact={compact}
              topPercent={yearToPercent(ghostSong.releaseYear)}
            />
          )}

          {/* ── Placed cards ────────────────────────────── */}
          {solidSorted.map((song, i) => {
            const pos = positionMap.get(song.spotifyId);
            return (
              <PlacedCard
                key={song.spotifyId}
                song={song}
                team={team}
                index={i}
                compact={compact}
                topPercent={pos?.adjusted ?? yearToPercent(song.releaseYear)}
              />
            );
          })}

          {/* ── Empty state ─────────────────────────────── */}
          {solidSorted.length === 0 && !showDropZones && (
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
