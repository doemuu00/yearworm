import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPlaylistTracks } from "@/lib/spotify/api";
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

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const accessToken = session.provider_token;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No Spotify access token available" },
      { status: 401 }
    );
  }

  try {
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
    console.error("Failed to fetch playlist tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist tracks" },
      { status: 500 }
    );
  }
}
