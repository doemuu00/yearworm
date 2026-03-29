'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import Button from '@/components/ui/Button';
import TopAppBar from '@/components/layout/TopAppBar';
import BottomNavBar from '@/components/layout/BottomNavBar';

const FEATURED_ERAS = [
  { label: 'The 80s', from: '#ec4899', to: '#a855f7' },
  { label: 'The 90s', from: '#f97316', to: '#eab308' },
  { label: 'Disco Era', from: '#8b5cf6', to: '#6366f1' },
  { label: 'Hot 100', from: '#06b6d4', to: '#3b82f6' },
];

export default function Home() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const [showJoin, setShowJoin] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateGame() {
    if (session) {
      router.push('/lobby/local');
      return;
    }
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes:
          'user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state',
      },
    });
  }

  function handleQuickPlay() {
    router.push('/lobby/local?demo=true');
  }

  async function handleJoinGame() {
    if (gameCode.length !== 4) return;
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?code=${gameCode.toUpperCase()}`,
        scopes:
          'user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state',
      },
    });
  }

  return (
    <div className="relative min-h-screen selection:bg-primary/30">
      <TopAppBar />
      <BottomNavBar />

      {/* ── Floating Background Elements ───────────────────── */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-20 left-[10%] music-note text-primary">
          <span className="material-symbols-outlined text-6xl">music_note</span>
        </div>
        <div className="absolute top-60 right-[15%] music-note text-secondary">
          <span className="material-symbols-outlined text-8xl">album</span>
        </div>
        <div className="absolute bottom-40 left-[20%] music-note text-tertiary">
          <span className="material-symbols-outlined text-7xl">graphic_eq</span>
        </div>
        <div className="absolute top-[40%] left-[45%] music-note text-primary">
          <span className="material-symbols-outlined text-5xl">audiotrack</span>
        </div>
        {/* Ambient Radial Gradients */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="relative z-10 pt-32 pb-32 px-6 flex flex-col items-center max-w-4xl mx-auto">
        {/* ── Hero Section ─────────────────────────────────── */}
        <motion.section
          className="w-full text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/15 text-xs font-semibold tracking-widest uppercase text-secondary">
            Now Playing: Global 50
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-black text-primary mb-6 neon-glow-primary tracking-tighter">
            Yearworm
          </h1>
          <p className="font-headline text-xl md:text-2xl text-on-surface-variant font-medium max-w-lg mx-auto leading-relaxed">
            Guess the song, <span className="text-secondary italic">build the timeline.</span>
          </p>
        </motion.section>

        {/* ── Bento Grid ───────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {/* Quick Play — col-span-8 */}
          <div
            onClick={handleQuickPlay}
            className="md:col-span-8 group relative overflow-hidden rounded-lg p-8 glass-panel flex flex-col justify-between h-[320px] shadow-[0_12px_32px_rgba(40,223,181,0.08)] shadow-primary-glow cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
              <span className="material-symbols-outlined text-[160px] leading-none select-none">
                play_arrow
              </span>
            </div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">bolt</span>
              <h2 className="font-display text-4xl font-bold text-on-surface mb-2">Quick Play</h2>
              <p className="text-on-surface-variant max-w-xs">
                Jump into a random era and start guessing songs immediately.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPlay();
              }}
              className="w-fit px-8 py-4 bg-gradient-to-br from-primary to-on-primary-container text-on-primary font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Start Guessing
            </button>
          </div>

          {/* Create Game — col-span-4 */}
          <div
            onClick={handleCreateGame}
            className="md:col-span-4 glass-card rounded-lg p-6 flex flex-col justify-between border border-outline-variant/10 hover:border-primary/30 transition-colors cursor-pointer group"
          >
            <div>
              <span className="material-symbols-outlined text-secondary text-3xl mb-4">
                add_circle
              </span>
              <h3 className="font-display text-2xl font-bold text-on-surface mb-1">Create</h3>
              <p className="text-sm text-on-surface-variant">
                Host a private session with friends and custom genres.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Join Game — col-span-4 */}
          <div
            onClick={() => {
              if (!showJoin) setShowJoin(true);
            }}
            className="md:col-span-4 glass-card rounded-lg p-6 flex flex-col justify-between border border-outline-variant/10 hover:border-tertiary/30 transition-colors cursor-pointer group"
          >
            {!showJoin ? (
              <>
                <div>
                  <span className="material-symbols-outlined text-tertiary text-3xl mb-4">
                    group
                  </span>
                  <h3 className="font-display text-2xl font-bold text-on-surface mb-1">Join</h3>
                  <p className="text-sm text-on-surface-variant">
                    Enter a lobby code to play with your crew.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-all">
                    <span className="material-symbols-outlined">login</span>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                className="flex flex-col gap-3 h-full justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-sm font-medium text-on-surface-variant">
                  Enter 4-character game code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={gameCode}
                  onChange={(e) =>
                    setGameCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  placeholder="ABCD"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container/60 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-on-surface placeholder-on-surface-variant/30 outline-none transition-colors focus:border-primary/50"
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading && showJoin}
                    disabled={gameCode.length !== 4}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleJoinGame();
                    }}
                  >
                    Join
                  </Button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowJoin(false);
                      setGameCode('');
                    }}
                    className="text-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors px-3"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Stats — col-span-8 */}
          <div className="md:col-span-8 glass-card rounded-lg p-8 flex items-center gap-8 border border-outline-variant/10">
            {/* Waveform placeholder */}
            <div className="hidden sm:flex w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-surface-container-highest items-center justify-center">
              <span className="material-symbols-outlined text-primary/40 text-5xl">
                graphic_eq
              </span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-display font-bold text-lg">Daily Streak</h4>
                <span className="text-tertiary font-bold">5 Days</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary w-[70%]"
                  style={{ boxShadow: '0 0 10px rgba(243, 192, 26, 0.4)' }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-on-surface-variant font-medium">
                <span>Progress to Rank: Vinyl Master</span>
                <span>700/1000 XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Featured Eras ────────────────────────────────── */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            Featured Eras
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURED_ERAS.map((era) => (
              <div
                key={era.label}
                className="aspect-square rounded-lg bg-surface-container overflow-hidden relative group cursor-pointer"
              >
                {/* Placeholder colored background instead of image */}
                <div
                  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 to-transparent flex items-end p-4">
                  <span className="font-display font-bold text-on-surface">{era.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
