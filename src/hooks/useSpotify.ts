'use client';

import { useState, useCallback } from 'react';
import type { SpotifyPlaylist } from '@/lib/spotify/types';
import type { Song } from '@/lib/game/types';

interface PlaylistSongsResult {
  songs: Song[];
  totalTracks: number;
  filteredCount: number;
  hasEnoughSongs: boolean;
}

export function useSpotify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaylists = useCallback(async (query: string): Promise<SpotifyPlaylist[]> => {
    if (!query.trim()) return [];

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(query.trim())}`,
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Search failed (${res.status})`);
      }

      const data = await res.json();
      return data.playlists ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search playlists';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlaylistSongs = useCallback(async (playlistId: string): Promise<PlaylistSongsResult> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/spotify/playlist?id=${encodeURIComponent(playlistId)}`,
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load playlist (${res.status})`);
      }

      const data: PlaylistSongsResult = await res.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load playlist songs';
      setError(message);
      return { songs: [], totalTracks: 0, filteredCount: 0, hasEnoughSongs: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    searchPlaylists,
    getPlaylistSongs,
    loading,
    error,
    clearError,
  };
}
