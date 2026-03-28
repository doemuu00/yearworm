'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpotify } from '@/hooks/useSpotify';
import type { SpotifyPlaylist } from '@/lib/spotify/types';
import type { Song } from '@/lib/game/types';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlaylistPickerProps {
  onPlaylistSelected: (songs: Song[], playlistId: string, playlistName: string) => void;
}

interface PlaylistDetail {
  playlist: SpotifyPlaylist;
  songs: Song[];
  totalTracks: number;
  filteredCount: number;
  hasEnoughSongs: boolean;
}

export default function PlaylistPicker({ onPlaylistSelected }: PlaylistPickerProps) {
  const { searchPlaylists, getPlaylistSongs, loading, error, clearError } = useSpotify();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyPlaylist[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<PlaylistDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const playlists = await searchPlaylists(query);
      setResults(playlists);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchPlaylists]);

  const handleSelectPlaylist = useCallback(async (playlist: SpotifyPlaylist) => {
    setLoadingDetail(true);
    clearError();
    const result = await getPlaylistSongs(playlist.id);
    setSelectedDetail({
      playlist,
      songs: result.songs,
      totalTracks: result.totalTracks,
      filteredCount: result.filteredCount,
      hasEnoughSongs: result.hasEnoughSongs,
    });
    setLoadingDetail(false);
  }, [getPlaylistSongs, clearError]);

  const handleBackToSearch = useCallback(() => {
    setSelectedDetail(null);
    clearError();
    // Re-focus search input after transition
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [clearError]);

  const handleConfirm = useCallback(() => {
    if (!selectedDetail) return;
    onPlaylistSelected(
      selectedDetail.songs,
      selectedDetail.playlist.id,
      selectedDetail.playlist.name,
    );
  }, [selectedDetail, onPlaylistSelected]);

  const previewPercent = selectedDetail
    ? Math.round((selectedDetail.filteredCount / selectedDetail.totalTracks) * 100)
    : 0;
  const lowPreviewWarning = selectedDetail ? previewPercent < 70 : false;
  const tooFewSongs = selectedDetail ? selectedDetail.filteredCount < 10 : false;

  // Detail view for selected playlist
  if (selectedDetail) {
    const { playlist, filteredCount, totalTracks, hasEnoughSongs } = selectedDetail;
    const imageUrl = playlist.images[0]?.url;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="glass-card p-6 rounded-xl">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={playlist.name}
                className="w-24 h-24 rounded-lg object-cover shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <MusicIcon className="w-10 h-10 text-white/30" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{playlist.name}</h3>
              {playlist.description && (
                <p className="text-sm text-white/50 mt-1 line-clamp-2">
                  {stripHtml(playlist.description)}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-white">{totalTracks}</div>
              <div className="text-xs text-white/50 mt-0.5">Total Tracks</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <div className={`text-2xl font-bold ${tooFewSongs ? 'text-red-400' : 'text-[#00d4aa]'}`}>
                {filteredCount}
              </div>
              <div className="text-xs text-white/50 mt-0.5">With Previews</div>
            </div>
          </div>

          {/* Warnings */}
          <AnimatePresence>
            {lowPreviewWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-start gap-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-4 py-3">
                  <WarningIcon className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#f59e0b]">
                    Only {previewPercent}% of tracks have audio previews.
                    The game experience may be limited.
                  </p>
                </div>
              </motion.div>
            )}
            {tooFewSongs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
                  <WarningIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">
                    Fewer than 10 songs have previews. Choose a playlist
                    with more playable tracks for a better game.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!hasEnoughSongs}
              onClick={handleConfirm}
            >
              Select This Playlist
            </Button>
            <button
              onClick={handleBackToSearch}
              className="text-sm text-white/50 hover:text-white transition-colors text-center py-2"
            >
              &larr; Back to Search
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Search view
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search Spotify playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30
                     pl-12 pr-4 py-3.5 text-base outline-none transition-all
                     focus:border-[#00d4aa]/50 focus:ring-2 focus:ring-[#00d4aa]/20 focus:bg-white/[0.07]"
          autoFocus
        />
        {loading && !loadingDetail && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Loading overlay for detail fetch */}
      {loadingDetail && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-white/50 text-sm">Loading playlist tracks...</p>
        </div>
      )}

      {/* Results Grid */}
      {!loadingDetail && (
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {results.map((playlist, i) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  index={i}
                  onClick={() => handleSelectPlaylist(playlist)}
                />
              ))}
            </motion.div>
          ) : query.trim() && !loading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <p className="text-white/40 text-sm">No playlists found. Try a different search.</p>
            </motion.div>
          ) : !query.trim() ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <MusicIcon className="w-12 h-12 text-white/15 mx-auto mb-4" />
              <p className="text-white/40 text-sm">
                Search for a playlist to use as your song pool
              </p>
              <p className="text-white/25 text-xs mt-2">
                Try &quot;2000s hits&quot;, &quot;classic rock&quot;, or &quot;pop anthems&quot;
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </div>
  );
}

// --- Sub-components ---

function PlaylistCard({
  playlist,
  index,
  onClick,
}: {
  playlist: SpotifyPlaylist;
  index: number;
  onClick: () => void;
}) {
  const imageUrl = playlist.images[0]?.url;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      className="glass-card rounded-xl p-3 flex items-center gap-3 text-left w-full
                 hover:bg-white/[0.08] transition-all duration-200 group cursor-pointer"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={playlist.name}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-md
                     group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <MusicIcon className="w-6 h-6 text-white/30" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#00d4aa] transition-colors">
          {playlist.name}
        </h4>
        <p className="text-xs text-white/40 mt-0.5">
          {playlist.tracks?.total ?? playlist.items?.total ?? 0} tracks
        </p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
    </motion.button>
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
