'use client';

import { motion } from 'framer-motion';
import type { Song, PlacedSong } from '@/lib/game/types';

interface SongCardProps {
  song: Song | PlacedSong;
  revealed?: boolean;
  teamColor?: string;
  isDragging?: boolean;
  className?: string;
}

function isPlacedSong(song: Song | PlacedSong): song is PlacedSong {
  return 'placedAtIndex' in song;
}

export default function SongCard({
  song,
  revealed = false,
  teamColor = '#00d4aa',
  isDragging = false,
  className = '',
}: SongCardProps) {
  const placed = isPlacedSong(song);
  const showDetails = revealed || placed;

  return (
    <motion.div
      className={`relative flex-shrink-0 overflow-hidden select-none ${className}`}
      style={{
        width: 120,
        height: 160,
        borderRadius: 12,
        border: `1.5px solid ${teamColor}33`,
        boxShadow: isDragging
          ? `0 0 24px ${teamColor}44, 0 20px 40px rgba(0,0,0,0.5)`
          : `0 0 8px ${teamColor}22, 0 4px 12px rgba(0,0,0,0.3)`,
      }}
      initial={false}
      animate={{
        scale: isDragging ? 1.08 : 1,
        rotate: isDragging ? 2 : 0,
        y: isDragging ? -8 : 0,
      }}
      whileHover={!isDragging ? { scale: 1.04, y: -3 } : undefined}
      whileTap={!isDragging ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Album art background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${song.albumArtUrl})`,
          filter: showDetails ? 'none' : 'blur(8px) brightness(0.4)',
        }}
      />

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: showDetails
            ? 'linear-gradient(to top, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.2) 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-2.5">
        {!showDetails ? (
          /* Mystery card state */
          <div className="flex flex-1 items-center justify-center">
            <motion.span
              className="text-4xl font-black"
              style={{ color: teamColor, textShadow: `0 0 20px ${teamColor}66` }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              ?
            </motion.span>
          </div>
        ) : (
          /* Revealed state */
          <>
            {/* Year badge */}
            <div className="mb-auto flex justify-end pt-0.5">
              <motion.span
                className="rounded-md px-1.5 py-0.5 text-xs font-extrabold"
                style={{
                  background: `${teamColor}22`,
                  color: teamColor,
                  border: `1px solid ${teamColor}44`,
                  textShadow: `0 0 8px ${teamColor}88`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              >
                {song.releaseYear}
              </motion.span>
            </div>

            {/* Song info */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <p className="truncate text-[11px] font-bold leading-tight text-white">
                {song.title}
              </p>
              <p className="truncate text-[10px] leading-tight text-white/60">
                {song.artist}
              </p>
            </motion.div>

            {/* Correctness indicator for placed songs */}
            {placed && (
              <motion.div
                className="mt-1 flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: song.placedCorrectly ? '#00d4aa' : '#ef4444',
                    boxShadow: song.placedCorrectly
                      ? '0 0 6px #00d4aa88'
                      : '0 0 6px #ef444488',
                  }}
                />
                <span
                  className="text-[9px] font-medium"
                  style={{
                    color: song.placedCorrectly ? '#00d4aa' : '#ef4444',
                  }}
                >
                  {song.placedCorrectly ? 'Correct' : 'Wrong'}
                </span>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Top shimmer for mystery cards */}
      {!showDetails && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 30%, ${teamColor}11 50%, transparent 70%)`,
          }}
          animate={{ x: [-120, 120] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        />
      )}
    </motion.div>
  );
}
