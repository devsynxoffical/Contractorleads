/**
 * OpenAI key helpers — treat placeholders as missing so we never
 * silently call the API with "sk-..." and fall back to dummy scores.
 * Effective key: admin-saved DB value wins, else OPENAI_API_KEY env.
 */

import { resolvePlatformKey } from "@/lib/platform-keys";

const PLACEHOLDER_PATTERNS = [
  /^sk-\.\.\.$/i,
  /^sk-proj-\.\.\.$/i,
  /^your[-_]?/i,
  /^changeme$/i,
  /^xxx+$/i,
  /^paste/i,
];

function isValidKey(raw: string): boolean {
  if (raw.length < 20) return false;
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(raw))) return false;
  if (!raw.startsWith("sk-")) return false;
  return true;
}

export async function getOpenAIApiKey(): Promise<string | null> {
  const raw = (await resolvePlatformKey("openaiApiKey")).trim();
  if (!raw) return null;
  return isValidKey(raw) ? raw : null;
}

export async function isOpenAIConfigured(): Promise<boolean> {
  return Boolean(await getOpenAIApiKey());
}
