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

/* ── Draggable Song Card (Stitch mystery card) ─────────── */

interface DraggableSongCardProps {
  song: Song;
  team: Team;
}

export function DraggableSongCard({ song, team }: DraggableSongCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({ id: 'current-song' });
  const isA = team === 'A';
  const border = isA ? 'border-primary/20 hover:border-primary/40' : 'border-secondary/20 hover:border-secondary/40';
  const circleBg = isA ? 'bg-primary/5 border-primary/10' : 'bg-secondary/5 border-secondary/10';
  const qColor = isA ? 'text-primary/40' : 'text-secondary/40';
  const labelColor = isA ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10';

  return (
    <motion.div
      ref={setNodeRef}
      style={{ touchAction: 'none', opacity: isDragging ? 0.3 : 1 }}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ scale: 1, opacity: isDragging ? 0.3 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`w-52 h-64 glass-panel rounded-2xl border-2 ${border} flex flex-col items-center justify-center shadow-2xl relative overflow-hidden cursor-grab active:cursor-grabbing transition-colors select-none`}
      role="button"
      aria-label="Drag this song onto the timeline"
      tabIndex={0}
      aria-roledescription="draggable"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 shimmer animate-[shimmer_3s_infinite]" />

      {/* Question mark icon */}
      <div className={`w-20 h-20 rounded-full ${circleBg} flex items-center justify-center mb-4 border`}>
        <span className={`text-5xl font-headline font-black ${qColor}`}>?</span>
      </div>

      {/* Label */}
      <p className={`text-[10px] font-bold tracking-[0.2em] ${labelColor} uppercase px-3 py-1 rounded-full`}>
        {isDragging ? 'Drop on timeline' : 'Place In Timeline'}
      </p>
    </motion.div>
  );
}

/* ── Drag overlay card (floating copy under cursor) ────── */

export function DragOverlayCard({ song, team }: { song: Song; team: Team }) {
  const isA = team === 'A';
  const border = isA ? 'border-primary/20' : 'border-secondary/20';
  const circleBg = isA ? 'bg-primary/5 border-primary/10' : 'bg-secondary/5 border-secondary/10';
  const qColor = isA ? 'text-primary/40' : 'text-secondary/40';
  const labelColor = isA ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10';
  const glow = isA
    ? '0 0 32px rgba(40, 223, 181, 0.5), 0 20px 40px rgba(0,0,0,0.5)'
    : '0 0 32px rgba(208, 188, 255, 0.5), 0 20px 40px rgba(0,0,0,0.5)';

  return (
    <div
      className={`w-52 h-64 glass-panel rounded-2xl border-2 ${border} flex flex-col items-center justify-center shadow-2xl relative overflow-hidden select-none`}
      style={{ boxShadow: glow, transform: 'scale(1.05)' }}
    >
      <div className="absolute inset-0 shimmer animate-[shimmer_3s_infinite]" />
      <div className={`w-20 h-20 rounded-full ${circleBg} flex items-center justify-center mb-4 border`}>
        <span className={`text-5xl font-headline font-black ${qColor}`}>?</span>
      </div>
      <p className={`text-[10px] font-bold tracking-[0.2em] ${labelColor} uppercase px-3 py-1 rounded-full`}>
        Drop on timeline
      </p>
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

  // Always show Team A on left, Team B on right
  const teamATimeline = activeTeam === 'A' ? activeTimeline : opponentTimeline;
  const teamBTimeline = activeTeam === 'B' ? activeTimeline : opponentTimeline;
  const teamAIsActive = activeTeam === 'A';
  const teamBIsActive = activeTeam === 'B';

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 w-full items-stretch">
        {/* Left: Team A timeline */}
        <div className="flex-1 min-w-0">
          <Timeline
            timeline={teamATimeline}
            team="A"
            isActiveTeam={teamAIsActive}
            onPlaceSong={teamAIsActive ? onPlaceSong : () => {}}
            isDragActive={teamAIsActive ? isDragActive : false}
            compact={!teamAIsActive}
          />
        </div>

        {/* Center: Audio player / Draggable card */}
        <div className="flex flex-col items-center justify-center" style={{ width: 220 }}>
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

        {/* Right: Team B timeline */}
        <div className="flex-1 min-w-0">
          <Timeline
            timeline={teamBTimeline}
            team="B"
            isActiveTeam={teamBIsActive}
            onPlaceSong={teamBIsActive ? onPlaceSong : () => {}}
            isDragActive={teamBIsActive ? isDragActive : false}
            compact={!teamBIsActive}
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
