'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSpotify } from '@/hooks/useSpotify';
import type { Song } from '@/lib/game/types';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlaylistPickerProps {
  onPlaylistSelected: (songs: Song[], playlistId: string, playlistName: string) => void;
}

export default function PlaylistPicker({ onPlaylistSelected }: PlaylistPickerProps) {
  const { searchTracks, loading, error, clearError } = useSpotify();
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ songs: Song[]; totalTracks: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    clearError();
    const result = await searchTracks(query);
    setSearchResult({ songs: result.songs, totalTracks: result.totalTracks });
  }, [query, searchTracks, clearError]);

  const handleConfirm = useCallback(() => {
    if (!searchResult || searchResult.songs.length < 2) return;
    onPlaylistSelected(searchResult.songs, 'search', query.trim());
  }, [searchResult, onPlaylistSelected, query]);

  // Search result view
  if (searchResult) {
    const { songs, totalTracks } = searchResult;
    const hasEnough = songs.length >= 10;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="glass-card p-8 rounded-lg border border-outline-variant/15">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">music_note</span>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-on-surface">&quot;{query}&quot;</h3>
              <p className="text-sm text-on-surface-variant">{totalTracks} songs found</p>
            </div>
          </div>

          {/* Sample tracks */}
          <div className="space-y-2 mb-6 max-h-56 overflow-y-auto">
            {songs.slice(0, 8).map((song) => (
              <div key={song.spotifyId} className="flex items-center gap-3 rounded-lg bg-surface-container-highest/60 p-3">
                {song.albumArtUrl ? (
                  <img src={song.albumArtUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-surface-container-high" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-on-surface truncate">{song.title}</p>
                  <p className="text-xs text-on-surface-variant truncate">{song.artist} &middot; {song.releaseYear}</p>
                </div>
              </div>
            ))}
          </div>

          {!hasEnough && (
            <div className="flex items-start gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-3 mb-4">
              <WarningIcon className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">Not enough songs found. Try a broader search.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-error/10 border border-error/30 px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth disabled={!hasEnough} onClick={handleConfirm}>
              Use These Songs
            </Button>
            <button
              onClick={() => { setSearchResult(null); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors text-center py-2"
            >
              &larr; Search Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Search input view
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-extrabold text-on-surface">
          Choose Your <span className="text-primary">Music</span>
        </h2>
        <p className="text-on-surface-variant text-lg mt-2">
          Search for songs to build your game pool
        </p>
      </div>

      <div className="glass-card rounded-lg p-8 border border-outline-variant/15">
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl pointer-events-none">search</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for songs (e.g. &quot;80s rock&quot;, &quot;2000s pop&quot;)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-surface-container-highest border-0 rounded-md text-on-surface placeholder-on-surface-variant/40
                       pl-12 pr-4 py-4 text-base outline-none transition-all
                       focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleSearch} loading={loading} disabled={!query.trim()}>
          Search Songs
        </Button>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg bg-error/10 border border-error/30 px-4 py-3">
            <p className="text-sm text-error">{error}</p>
          </motion.div>
        )}

        {!query.trim() && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary/40 text-3xl">library_music</span>
            </div>
            <p className="text-on-surface-variant text-sm">Type a genre, era, or artist to get started</p>
            <p className="text-on-surface-variant/50 text-xs mt-2">
              Try &quot;80s rock hits&quot;, &quot;90s pop&quot;, or &quot;classic soul&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Inline icons ---

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
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

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

