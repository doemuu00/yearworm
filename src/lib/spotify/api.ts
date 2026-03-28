import type {
  SpotifyTrack,
  SpotifySearchResult,
  SpotifyPlaylistTracksResponse,
} from "./types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

async function fetchSpotify<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${SPOTIFY_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Spotify API error ${response.status}: ${response.statusText} - ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Search for playlists on Spotify.
 */
export async function searchPlaylists(
  query: string,
  accessToken: string,
  limit: number = 20
): Promise<SpotifySearchResult> {
  const params = new URLSearchParams({
    q: query,
    type: "playlist",
  });

  return fetchSpotify<SpotifySearchResult>(
    `/search?${params.toString()}`,
    accessToken
  );
}

/**
 * Get all tracks from a playlist, handling pagination in batches of 50.
 * Filters out null tracks (e.g. locally added or unavailable songs).
 */
export async function getPlaylistTracks(
  playlistId: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const allTracks: SpotifyTrack[] = [];
  let nextUrl: string | null =
    `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`;

  while (nextUrl) {
    const page: SpotifyPlaylistTracksResponse = await fetchSpotify<SpotifyPlaylistTracksResponse>(
      nextUrl,
      accessToken
    );

    for (const item of page.items) {
      if (item.track) {
        allTracks.push(item.track);
      }
    }

    nextUrl = page.next;
  }

  return allTracks;
}

/**
 * Extract the release year from a Spotify release_date string.
 * Handles formats: "YYYY", "YYYY-MM", "YYYY-MM-DD".
 */
export function parseReleaseYear(releaseDate: string): number {
  const yearStr = releaseDate.split("-")[0];
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) {
    throw new Error(`Invalid release date format: "${releaseDate}"`);
  }

  return year;
}
