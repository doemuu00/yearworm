'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Song, PlacedSong, Team } from '@/lib/game/types';
import { DESIGN_TOKENS } from '@/lib/game/types';
import { DraggableSongCard } from './GameBoard';

interface ActionBarProps {
  /** Current game phase */
  phase: string;
  /** The song to play / place */
  currentSong: Song | null;
  /** Whether the audio clip has finished and card is ready to drag */
  songReady: boolean;
  /** Active team (for styling) */
  currentTeam: Team;
  /** Whether we're in challenge-placing mode */
  isChallenging: boolean;
  /** The challenged song (shown during challenge-placing) */
  lastPlacedSong: PlacedSong | null;
  /** Challenger's team */
  challengingTeam: Team;
  /** Label for the team whose timeline is shown during challenge */
  placingTeamLabel?: string;
  /** Audio player node (rendered by parent) */
  audioPlayer: React.ReactNode;
  /** Skip handler */
  onSkip?: () => void;
  /** Whether skip is available */
  canSkip: boolean;
}

export default function ActionBar({
  phase,
  currentSong,
  songReady,
  currentTeam,
  isChallenging,
  lastPlacedSong,
  challengingTeam,
  placingTeamLabel,
  audioPlayer,
  onSkip,
  canSkip,
}: ActionBarProps) {
  const showCard = isChallenging
    ? !!lastPlacedSong
    : songReady && !!currentSong;
  const cardTeam = isChallenging ? challengingTeam : currentTeam;
  const cardSong = isChallenging ? lastPlacedSong : currentSong;

  const isPlaying = phase === 'playing';
  const showAudioPlayer = isPlaying && !songReady && !isChallenging;
  const showDraggable = showCard && (isPlaying || isChallenging);

  // Don't render bar during modal phases (it would be behind overlays anyway)
  if (!isPlaying && !isChallenging) return null;

  const teamColor =
    cardTeam === 'A' ? DESIGN_TOKENS.colors.teamA : DESIGN_TOKENS.colors.teamB;

  return (
    <div className="shrink-0">
      {/* Floating draggable card above the bar */}
      <AnimatePresence>
        {showDraggable && cardSong && (
          <motion.div
            className="flex flex-col items-center gap-2 pb-2"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <DraggableSongCard song={cardSong} team={cardTeam} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bar */}
      <div
        className="flex items-center justify-center gap-3 px-3 py-2"
        style={{
          background: 'rgba(10, 14, 26, 0.9)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {showDraggable ? (
          /* Instruction text + skip when card is visible */
          <div className="flex items-center gap-4">
            {isChallenging ? (
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Place on {placingTeamLabel}&apos;s timeline
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ color: teamColor }}>
                  swipe_up
                </span>
                Drag card to timeline
              </span>
            )}

            {/* Skip button */}
            {!isChallenging && onSkip && (
              <button
                onClick={canSkip ? onSkip : undefined}
                disabled={!canSkip}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border ${
                  canSkip
                    ? currentTeam === 'A'
                      ? 'border-primary/20 text-primary/70 hover:bg-primary/10'
                      : 'border-secondary/20 text-secondary/70 hover:bg-secondary/10'
                    : 'border-white/5 text-on-surface-variant/30 cursor-not-allowed'
                }`}
                style={{ background: 'rgba(49, 52, 66, 0.4)' }}
              >
                <span className="material-symbols-outlined text-xs">skip_next</span>
                Skip (1 token)
              </button>
            )}
          </div>
        ) : showAudioPlayer ? (
          /* Audio player */
          <div className="flex items-center justify-center">
            {audioPlayer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
