import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getClientCredentialsToken } from "@/lib/spotify/client-credentials";
import type { Song } from "@/lib/game/types";

/**
 * Search for tracks by query (e.g. "80s rock hits").
 * Works with client credentials — no user auth needed.
 * Returns Song[] compatible with the game engine.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    try {
      accessToken = await getClientCredentialsToken();
    } catch {
      return NextResponse.json({ error: "Failed to get Spotify token" }, { status: 500 });
    }
  }

  try {
    // Fetch multiple pages to get enough tracks
    const allSongs: Song[] = [];
    const seen = new Set<string>();

    for (let offset = 0; offset < 200 && allSongs.length < 50; offset += 5) {
      const url = `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&offset=${offset}&limit=5`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) break;

      const data = await response.json();
      const tracks = data.tracks?.items ?? [];
      if (tracks.length === 0) break;

      for (const track of tracks) {
        if (!track || seen.has(track.id)) continue;
        seen.add(track.id);

        allSongs.push({
          spotifyId: track.id,
          title: track.name,
          artist: track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "Unknown",
          albumArtUrl: track.album?.images?.[0]?.url ?? "",
          previewUrl: track.preview_url ?? null,
          releaseYear: parseInt((track.album?.release_date ?? "2000").substring(0, 4), 10),
        });
      }
    }

    const withPreviews = allSongs.filter(s => s.previewUrl);

    return NextResponse.json({
      songs: allSongs,
      songsWithPreviews: withPreviews.length,
      totalSongs: allSongs.length,
      hasEnoughSongs: allSongs.length >= 10,
    });
  } catch (error) {
    console.error("Track search failed:", error);
    return NextResponse.json({ error: "Track search failed" }, { status: 500 });
  }
}
