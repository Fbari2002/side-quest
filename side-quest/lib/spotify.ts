export function isMobileUA(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
}

export function spotifyWebSearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export function spotifyAppSearchUrl(query: string): string {
  return `spotify:search:${encodeURIComponent(query)}`;
}

export async function openSpotifySearch(query: string): Promise<"app" | "web"> {
  const web = spotifyWebSearchUrl(query);
  if (typeof window === "undefined") return "web";

  if (!isMobileUA()) {
    window.open(web, "_blank", "noopener,noreferrer");
    return "web";
  }

  window.location.href = spotifyAppSearchUrl(query);
  window.setTimeout(() => {
    window.location.href = web;
  }, 700);

  return "app";
}
