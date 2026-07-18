/**
 * OpenAI key helpers — treat placeholders as missing so we never
 * silently call the API with "sk-..." and fall back to dummy scores.
 */

const PLACEHOLDER_PATTERNS = [
  /^sk-\.\.\.$/i,
  /^sk-proj-\.\.\.$/i,
  /^your[-_]?/i,
  /^changeme$/i,
  /^xxx+$/i,
  /^paste/i,
];

export function getOpenAIApiKey(): string | null {
  const raw = process.env.OPENAI_API_KEY?.trim();
  if (!raw) return null;
  if (raw.length < 20) return null;
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(raw))) return null;
  if (!raw.startsWith("sk-")) return null;
  return raw;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}
