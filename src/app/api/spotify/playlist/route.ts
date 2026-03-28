import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPlaylistTracks } from "@/lib/spotify/api";
import { getClientCredentialsToken } from "@/lib/spotify/client-credentials";
import { Song } from "@/lib/game/types";

export async function GET(request: NextRequest) {
  const playlistId = request.nextUrl.searchParams.get("id");

  if (!playlistId) {
    return NextResponse.json(
      { error: "Missing playlist ID parameter 'id'" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Session is optional — we can fall back to client credentials

  // Try cookie first, then session, then client credentials as fallback
  let accessToken = cookieStore.get("spotify_access_token")?.value
    ?? session?.provider_token;

  if (!accessToken) {
    try {
      accessToken = await getClientCredentialsToken();
    } catch {
      return NextResponse.json(
        { error: "Failed to get Spotify access token" },
        { status: 500 }
      );
    }
  }

  try {
    console.log("Fetching playlist with token type:", accessToken === cookieStore.get("spotify_access_token")?.value ? "cookie" : accessToken === session?.provider_token ? "session" : "client-credentials");
    const tracks = await getPlaylistTracks(playlistId, accessToken);
    const totalTracks = tracks.length;

    const songs: Song[] = tracks
      .filter((track) => track.preview_url)
      .map((track) => ({
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        albumArtUrl: track.album.images[0]?.url ?? "",
        previewUrl: track.preview_url!,
        releaseYear: parseInt(track.album.release_date.substring(0, 4), 10),
      }));

    return NextResponse.json({
      songs,
      totalTracks,
      filteredCount: songs.length,
      hasEnoughSongs: songs.length >= 10,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch playlist tracks:", msg);

    // If it's a 403, the token doesn't have playlist access (likely client credentials)
    if (msg.includes('403')) {
      return NextResponse.json(
        { error: "Spotify login required to fetch playlist tracks. Please log in with Spotify first." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch playlist tracks: " + msg },
      { status: 500 }
    );
  }
}
