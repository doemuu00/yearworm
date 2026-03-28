'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import Button from '@/components/ui/Button';

export default function Home() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const [showJoin, setShowJoin] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateGame() {
    // If already authenticated with Spotify, go straight to lobby
    if (session) {
      router.push('/lobby/local');
      return;
    }
    // Otherwise, trigger Spotify OAuth first
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        {/* Decorative worm element */}
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="text-[#00d4aa]"
          >
            {/* Music note with worm tail */}
            <path
              d="M38 12v28a8 8 0 1 1-4-6.93V16l-12 3v23a8 8 0 1 1-4-6.93V14l20-5v3z"
              fill="currentColor"
              opacity="0.9"
            />
            <circle cx="26" cy="44" r="5" fill="currentColor" opacity="0.7" />
            <circle cx="38" cy="40" r="5" fill="currentColor" opacity="0.7" />
            {/* Worm-like squiggle */}
            <path
              d="M44 10c4-2 8 0 8 4s-4 6-8 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <circle cx="54" cy="12" r="2" fill="currentColor" opacity="0.4" />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="glow-green mb-2 text-center text-5xl font-extrabold tracking-tight text-white sm:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Yearworm
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mb-12 text-center text-lg text-white/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Guess the song, build the timeline
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading && !showJoin}
            onClick={handleCreateGame}
          >
            Create Game
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleQuickPlay}
          >
            Quick Play (Demo)
          </Button>

          {!showJoin ? (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => setShowJoin(true)}
            >
              Join Game
            </Button>
          ) : (
            <motion.div
              className="glass-card flex flex-col gap-3 p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <label className="text-sm font-medium text-white/60">
                Enter 4-character game code
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={4}
                  value={gameCode}
                  onChange={(e) =>
                    setGameCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  placeholder="ABCD"
                  autoFocus
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-white placeholder-white/20 outline-none transition-colors focus:border-[#00d4aa]/50 focus:bg-white/8"
                />
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading && showJoin}
                  disabled={gameCode.length !== 4}
                  onClick={handleJoinGame}
                >
                  Join
                </Button>
              </div>
              <button
                onClick={() => {
                  setShowJoin(false);
                  setGameCode('');
                }}
                className="text-sm text-white/40 transition-colors hover:text-white/60"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          className="mt-16 flex justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-[#00d4aa]"
              style={{
                width: `${12 + Math.sin(i * 1.2) * 8}px`,
                opacity: 0.2 + i * 0.1,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
