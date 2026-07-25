/**
 * Normalize a phone string to E.164 for Twilio.
 * Defaults to +1 (US/CA) when the number has 10 digits and no country code.
 */
export function toE164(
  raw: string | null | undefined,
  defaultCountry = "US",
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already E.164-ish
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (defaultCountry === "US" || defaultCountry === "CA") {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  }

  // International with leading 00
  if (digits.startsWith("00") && digits.length >= 10) {
    return `+${digits.slice(2)}`;
  }

  // Best effort: if it looks long enough, prefix +
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/** Compare two phones after E.164 normalization. */
export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ea = toE164(a);
  const eb = toE164(b);
  return Boolean(ea && eb && ea === eb);
}
