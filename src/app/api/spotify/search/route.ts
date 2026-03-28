import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getAccessToken(supabase: ReturnType<typeof createServerClient>): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.provider_token ?? null;
}

async function refreshAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  // We need to get the refresh token from the session first
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
  } = await supabase.auth.getSession();

  const refreshToken = session?.provider_refresh_token;
  if (!refreshToken) return null;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.access_token;
}

async function searchSpotify(query: string, accessToken: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=playlist&q=${encodeURIComponent(query)}&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing search query parameter 'q'" },
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

  let accessToken = await getAccessToken(supabase);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  let response = await searchSpotify(query, accessToken);

  // If token expired, attempt refresh and retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return NextResponse.json(
        { error: "Failed to refresh Spotify token" },
        { status: 401 }
      );
    }
    accessToken = newToken;
    response = await searchSpotify(query, accessToken);
  }

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Spotify search error:", errorData);
    return NextResponse.json(
      { error: "Spotify search failed" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
