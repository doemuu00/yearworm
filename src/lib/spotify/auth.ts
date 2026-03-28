import { createClient } from "@/lib/supabase/client";

/**
 * Get the Spotify access token (provider_token) from the current
 * Supabase auth session. Returns null if the user is not authenticated
 * or has no Spotify provider token.
 */
export async function getSpotifyTokenFromSupabase(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.provider_token ?? null;
}

/**
 * Attempt to refresh the Spotify access token by calling our API route.
 * Returns the new access token on success, or null on failure.
 */
export async function refreshSpotifyToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh-token", {
      method: "POST",
    });

    if (!response.ok) {
      console.error(
        "Failed to refresh Spotify token:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    return data.access_token ?? null;
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    return null;
  }
}

/**
 * Get a valid Spotify token, attempting a refresh if the current one
 * is unavailable.
 */
export async function getValidSpotifyToken(): Promise<string | null> {
  const token = await getSpotifyTokenFromSupabase();

  if (token) {
    return token;
  }

  // Token missing or expired -- try refreshing
  return refreshSpotifyToken();
}
