export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: "year" | "month" | "day";
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  duration_ms: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks?: {
    total: number;
  };
  items?: {
    total: number;
    href: string;
  };
}

export interface SpotifySearchResult {
  playlists: {
    items: SpotifyPlaylist[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
  };
}

export interface SpotifyPlaylistTracksResponse {
  items: Array<{
    track: SpotifyTrack | null;
    added_at: string;
  }>;
  next: string | null;
  total: number;
  limit: number;
  offset: number;
}
