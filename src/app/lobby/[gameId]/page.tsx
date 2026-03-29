'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PlaylistPicker from '@/components/lobby/PlaylistPicker';
import GameSettingsPanel from '@/components/lobby/GameSettings';
import TeamSetup from '@/components/lobby/TeamSetup';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/stores/gameStore';
import { shuffle } from '@/lib/utils/shuffle';
import { DEMO_SONGS } from '@/lib/game/demo-songs';
import { DEFAULT_GAME_SETTINGS } from '@/lib/game/types';
import type { Song, GameSettings } from '@/lib/game/types';

const STEP_LABELS_FULL = ['Playlist', 'Settings', 'Teams'];
const STEP_LABELS_DEMO = ['Settings', 'Teams'];

// Slide transition variants keyed by direction
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  // If demo mode, skip step 1 (playlist selection) — start at step 2
  const [step, setStep] = useState(isDemo ? 2 : 1);
  const [direction, setDirection] = useState(1);

  // Playlist state
  const [songs, setSongs] = useState<Song[]>(isDemo ? DEMO_SONGS : []);
  const [playlistName, setPlaylistName] = useState(isDemo ? 'Demo Playlist' : '');
  const [songCount, setSongCount] = useState(isDemo ? DEMO_SONGS.length : 0);

  // Settings state
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  // Team state
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  }, [step]);

  const handlePlaylistSelected = useCallback(
    (selectedSongs: Song[], _playlistId: string, name: string) => {
      setSongs(selectedSongs);
      setPlaylistName(name);
      setSongCount(selectedSongs.length);
      goToStep(2);
    },
    [goToStep],
  );

  const handleStartGame = useCallback(() => {
    const shuffledSongs = shuffle(songs);
    useGameStore.getState().initGame(shuffledSongs, settings);
    router.push('/game/local');
  }, [songs, settings, router]);

  // Determine the minimum step the user can go back to
  const minStep = isDemo ? 2 : 1;

  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-8 overflow-hidden">
      {/* Background ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-secondary/[0.06] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-tertiary/[0.04] blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Header */}
        <motion.button
          onClick={() => router.push('/')}
          className="text-on-surface-variant/60 text-sm hover:text-on-surface transition-colors mb-6 flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Home
        </motion.button>

        <motion.h1
          className="text-3xl font-display font-extrabold text-on-surface mb-2 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Game Setup
        </motion.h1>

        {/* Progress bar (Stitch wizard steps) */}
        <motion.div
          className="mb-10 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {(() => {
            const labels = isDemo ? STEP_LABELS_DEMO : STEP_LABELS_FULL;
            const displayStep = isDemo ? step - 1 : step; // demo: 2→1, 3→2
            const totalSteps = labels.length;
            const currentLabel = labels[displayStep - 1] ?? '';
            const isLastStep = displayStep === totalSteps;

            return (
              <>
                {/* Labels above bar */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    Step {displayStep} &mdash; {currentLabel}
                  </span>
                  {isLastStep && (
                    <span className="text-xs font-bold text-primary">
                      Ready to Play
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex h-1.5 w-full gap-1 rounded-full bg-surface-container-highest">
                  {labels.map((label, i) => {
                    const segmentStep = i + 1;
                    const isCurrent = displayStep === segmentStep;

                    return (
                      <div
                        key={label}
                        className={`h-full rounded-full transition-all duration-500 ${isCurrent ? 'bg-primary' : 'bg-transparent'}`}
                        style={{ width: `${100 / totalSteps}%` }}
                      />
                    );
                  })}
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Step content with animated transitions */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <PlaylistPicker onPlaylistSelected={handlePlaylistSelected} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Playlist summary */}
                <div className="glass-card rounded-lg p-5 mb-8 flex items-center gap-4 border border-primary/10">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">music_note</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-display font-bold text-on-surface truncate">
                      {playlistName}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {songCount} songs
                    </p>
                  </div>
                  {!isDemo && (
                    <button
                      onClick={() => goToStep(1)}
                      className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider"
                    >
                      Change
                    </button>
                  )}
                </div>

                <GameSettingsPanel
                  settings={settings}
                  onSettingsChange={setSettings}
                />

                <div className="flex gap-3 mt-10">
                  {!isDemo && (
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => goToStep(1)}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => goToStep(3)}
                  >
                    Next: Invite Teams
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <TeamSetup
                  teamAName={teamAName}
                  teamBName={teamBName}
                  onTeamANameChange={setTeamAName}
                  onTeamBNameChange={setTeamBName}
                />

                <div className="mt-6 text-center">
                  <p className="text-sm text-on-surface-variant mb-8">
                    <span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">info</span>
                    Name your teams and get ready to play!
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
