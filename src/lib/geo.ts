/**
 * Helpers for lead map coordinates.
 * Many older / reused leads lack latitude/longitude even when Places
 * returned them — we backfill from googleMapsLink when possible.
 */

export type LatLng = { latitude: number; longitude: number };

function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Extract lat/lng from common Google Maps URL shapes:
 * - .../@37.7749,-122.4194,15z
 * - ...!3d37.7749!4d-122.4194
 * - ...?q=37.7749,-122.4194
 * - ...?ll=37.7749,-122.4194
 */
export function parseCoordsFromMapsUrl(
  url?: string | null,
): LatLng | null {
  if (!url?.trim()) return null;
  const raw = url.trim();

  const at = raw.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (at) {
    const latitude = Number(at[1]);
    const longitude = Number(at[2]);
    if (isValidCoord(latitude, longitude)) return { latitude, longitude };
  }

  const bang = raw.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (bang) {
    const latitude = Number(bang[1]);
    const longitude = Number(bang[2]);
    if (isValidCoord(latitude, longitude)) return { latitude, longitude };
  }

  const q = raw.match(/[?&](?:q|ll|center)=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i);
  if (q) {
    const latitude = Number(q[1]);
    const longitude = Number(q[2]);
    if (isValidCoord(latitude, longitude)) return { latitude, longitude };
  }

  return null;
}

export function resolveLeadCoords(lead: {
  latitude?: number | null;
  longitude?: number | null;
  googleMapsLink?: string | null;
}): LatLng | null {
  if (
    lead.latitude != null &&
    lead.longitude != null &&
    isValidCoord(lead.latitude, lead.longitude)
  ) {
    return { latitude: lead.latitude, longitude: lead.longitude };
  }
  return parseCoordsFromMapsUrl(lead.googleMapsLink);
}

const COUNTRY_ALIASES: Record<string, string> = {
  US: "US",
  USA: "US",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
  CA: "CA",
  CANADA: "CA",
  GB: "GB",
  UK: "GB",
  "UNITED KINGDOM": "GB",
  AU: "AU",
  AUSTRALIA: "AU",
  NZ: "NZ",
  "NEW ZEALAND": "NZ",
};

/** Normalize stored country values to ISO-ish 2-letter codes for the map. */
export function normalizeCountryCode(code?: string | null): string {
  if (!code?.trim()) return "US";
  const key = code.trim().toUpperCase();
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
  if (/^[A-Z]{2}$/.test(key)) return key;
  return key.slice(0, 2);
}
