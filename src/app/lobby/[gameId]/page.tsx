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

const STEP_LABELS = ['Playlist', 'Settings', 'Teams'];

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
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <motion.button
          onClick={() => router.push('/')}
          className="text-white/40 text-sm hover:text-white/70 transition-colors mb-6 flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </motion.button>

        <motion.h1
          className="text-2xl font-bold text-white mb-8 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Game Setup
        </motion.h1>

        {/* Step indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            const isSkipped = isDemo && stepNum === 1;

            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 transition-colors duration-300 ${
                      isComplete || isActive ? 'bg-[#00d4aa]/60' : 'bg-white/10'
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isSkipped
                        ? 'bg-white/5 text-white/20'
                        : isActive
                          ? 'bg-[#00d4aa] text-[#0a0e1a] shadow-md shadow-[#00d4aa]/30'
                          : isComplete
                            ? 'bg-[#00d4aa]/20 text-[#00d4aa]'
                            : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {isComplete ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-300 ${
                      isSkipped
                        ? 'text-white/15'
                        : isActive
                          ? 'text-white/80'
                          : isComplete
                            ? 'text-white/40'
                            : 'text-white/20'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
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
                <div className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center flex-shrink-0">
                    <MusicIcon className="w-5 h-5 text-[#00d4aa]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {playlistName}
                    </p>
                    <p className="text-xs text-white/40">
                      {songCount} songs
                    </p>
                  </div>
                  {!isDemo && (
                    <button
                      onClick={() => goToStep(1)}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>

                <GameSettingsPanel
                  settings={settings}
                  onSettingsChange={setSettings}
                />

                <div className="flex gap-3 mt-8">
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
                    Next
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

                <div className="flex gap-3 mt-8">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => goToStep(2)}
                  >
                    Back
                  </Button>
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

// --- Inline icons ---

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
      />
    </svg>
  );
}
