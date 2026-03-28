'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import Timeline from './Timeline';
import type { Song, PlacedSong, Team } from '@/lib/game/types';

/* ── Props ──────────────────────────────────────────────── */

export interface GameBoardProps {
  timeline: PlacedSong[];
  currentSong: Song | null;
  team: Team;
  onPlaceSong: (position: number) => void;
}

/* ── Team helpers ───────────────────────────────────────── */

const teamColor = (team: Team) =>
  team === 'A' ? '#00d4aa' : '#8b5cf6';

const teamColorRgb = (team: Team) =>
  team === 'A' ? '0, 212, 170' : '139, 92, 246';

/* ── Draggable Song Card (mystery style) ────────────────── */

interface DraggableSongCardProps {
  song: Song;
  team: Team;
}

function DraggableSongCard({ song, team }: DraggableSongCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: 'current-song' });

  const color = teamColor(team);
  const rgb = teamColorRgb(team);

  const style: React.CSSProperties = {
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ scale: 1, opacity: isDragging ? 0.3 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="relative w-[120px] h-[120px] rounded-xl overflow-hidden select-none shrink-0"
      role="button"
      aria-label="Drag this song onto the timeline"
      tabIndex={0}
      aria-roledescription="draggable"
    >
      {/* Blurred album art (mystery style) */}
      {song.albumArtUrl ? (
        <img
          src={song.albumArtUrl}
          alt="Mystery song"
          className="w-full h-full object-cover"
          style={{ filter: 'blur(16px) brightness(0.5)' }}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
      )}

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          border: `2px solid ${color}`,
          boxShadow: isDragging
            ? `0 0 24px rgba(${rgb}, 0.5), inset 0 0 24px rgba(${rgb}, 0.1)`
            : `0 0 12px rgba(${rgb}, 0.2)`,
        }}
      />

      {/* Question mark / drag hint */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-3xl font-bold text-white/80">?</span>
        <span className="text-[10px] text-white/50 font-medium">
          {isDragging ? 'Drop on timeline' : 'Drag me'}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Drag overlay card (floating copy under cursor) ────── */

function DragOverlayCard({ song, team }: { song: Song; team: Team }) {
  const color = teamColor(team);
  const rgb = teamColorRgb(team);

  return (
    <div
      className="relative w-[120px] h-[120px] rounded-xl overflow-hidden select-none"
      style={{
        boxShadow: `0 0 32px rgba(${rgb}, 0.5), 0 20px 40px rgba(0,0,0,0.5)`,
        transform: 'scale(1.1)',
      }}
    >
      {song.albumArtUrl ? (
        <img
          src={song.albumArtUrl}
          alt="Mystery song"
          className="w-full h-full object-cover"
          style={{ filter: 'blur(16px) brightness(0.5)' }}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
      )}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          border: `2px solid ${color}`,
          boxShadow: `0 0 24px rgba(${rgb}, 0.5), inset 0 0 24px rgba(${rgb}, 0.1)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-3xl font-bold text-white/80">?</span>
        <span className="text-[10px] text-white/50 font-medium">Drop on timeline</span>
      </div>
    </div>
  );
}

/* ── GameBoard ──────────────────────────────────────────── */

export default function GameBoard({
  timeline,
  currentSong,
  team,
  onPlaceSong,
}: GameBoardProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  /* Sensors with activation constraint to avoid accidental drags */
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  /* Handlers */
  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setIsDragActive(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragActive(false);

      const { over } = event;
      if (!over) return;

      // Drop zone IDs follow the pattern "drop-{index}"
      const match = String(over.id).match(/^drop-(\d+)$/);
      if (match) {
        const position = parseInt(match[1], 10);
        onPlaceSong(position);
      }
    },
    [onPlaceSong],
  );

  const handleDragCancel = useCallback(() => {
    setIsDragActive(false);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Timeline */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: teamColor(team), opacity: 0.7 }}
          >
            {team === 'A' ? 'Team A' : 'Team B'} Timeline
          </h3>

          <Timeline
            timeline={timeline}
            team={team}
            isActiveTeam={!!currentSong}
            onPlaceSong={onPlaceSong}
            isDragActive={isDragActive}
          />
        </div>

        {/* Current song card (draggable) */}
        {currentSong && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
              Current Song
            </p>
            <DraggableSongCard song={currentSong} team={team} />
            <p className="text-xs text-white/30">
              Drag onto the timeline to place
            </p>
          </div>
        )}
      </div>

      {/* Floating drag overlay that follows the cursor */}
      <DragOverlay dropAnimation={null}>
        {isDragActive && currentSong ? (
          <DragOverlayCard song={currentSong} team={team} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
