/** Client-safe Google Places messages — no API keys, billing, or Cloud Console details. */

export const PUBLIC_PLACES_SEARCH_UNAVAILABLE =
  "Location search is temporarily unavailable. Please try again in a moment.";

export const PUBLIC_PLACES_SUGGESTIONS_UNAVAILABLE =
  "Location suggestions are temporarily unavailable.";

export const PUBLIC_PLACES_INVALID_AREA =
  "Try a city with the state, or pick a location from the suggestions list.";

export function logGooglePlacesError(context: string, detail: string) {
  console.error(`[google-places] ${context}: ${detail}`);
}

export function isGooglePlacesInternalError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("google places") ||
    lower.includes("google_places") ||
    lower.includes("google cloud") ||
    lower.includes("billing") ||
    lower.includes("quota") ||
    lower.includes(".env")
  );
}

export function sanitizePlacesErrorForClient(
  message: string,
  fallback = PUBLIC_PLACES_SEARCH_UNAVAILABLE,
): string {
  if (isGooglePlacesInternalError(message)) return fallback;
  return message;
}
