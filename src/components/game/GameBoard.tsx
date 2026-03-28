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
  activeTimeline: PlacedSong[];
  opponentTimeline: PlacedSong[];
  currentSong: Song | null;
  activeTeam: Team;
  onPlaceSong: (position: number) => void;
  songReady: boolean;
  audioPlayer?: React.ReactNode;
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
  const { attributes, listeners, setNodeRef, isDragging } =
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
          boxShadow: `0 0 12px rgba(${rgb}, 0.2)`,
        }}
      />

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
  activeTimeline,
  opponentTimeline,
  currentSong,
  activeTeam,
  onPlaceSong,
  songReady,
  audioPlayer,
}: GameBoardProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const opponentTeam: Team = activeTeam === 'A' ? 'B' : 'A';

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

  const showDraggableCard = songReady && currentSong;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-4 w-full">
        {/* 1. Opponent timeline (top, compact, greyed out, locked) */}
        <div>
          <h3
            className="text-[10px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: teamColor(opponentTeam), opacity: 0.5 }}
          >
            {opponentTeam === 'A' ? 'Team A' : 'Team B'} Timeline
            <span className="ml-2 text-white/30">
              ({opponentTimeline.length} {opponentTimeline.length === 1 ? 'card' : 'cards'})
            </span>
          </h3>

          <Timeline
            timeline={opponentTimeline}
            team={opponentTeam}
            isActiveTeam={false}
            onPlaceSong={() => {}}
            isDragActive={false}
            compact
          />
        </div>

        {/* 2. Audio player / Draggable card (between timelines) */}
        <div className="flex justify-center py-3">
          {showDraggableCard ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <DraggableSongCard song={currentSong} team={activeTeam} />
            </motion.div>
          ) : (
            audioPlayer
          )}
        </div>

        {/* 3. Active team timeline (bottom, full size, with drop zones) */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: teamColor(activeTeam), opacity: 0.7 }}
          >
            {activeTeam === 'A' ? 'Team A' : 'Team B'} Timeline
          </h3>

          <Timeline
            timeline={activeTimeline}
            team={activeTeam}
            isActiveTeam={true}
            onPlaceSong={onPlaceSong}
            isDragActive={isDragActive}
          />
        </div>
      </div>

      {/* Floating drag overlay that follows the cursor */}
      <DragOverlay dropAnimation={null}>
        {isDragActive && currentSong ? (
          <DragOverlayCard song={currentSong} team={activeTeam} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
