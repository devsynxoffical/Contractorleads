/**
 * NinjaPear (nubela.co) — Proxycurl replacement.
 * Website-first company enrichment. Does NOT scrape LinkedIn.
 * Docs: https://nubela.co/docs
 */

import { resolvePlatformKey } from "@/lib/platform-keys";

export type NinjaPearCompany = {
  name: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
};

async function getNinjaPearApiKey(): Promise<string | null> {
  const key = (await resolvePlatformKey("ninjapearApiKey")).trim();
  return key || null;
}

export async function isNinjaPearConfigured(): Promise<boolean> {
  return Boolean(await getNinjaPearApiKey());
}

/**
 * Enrich a business from its website via NinjaPear Company Details.
 * Returns social URLs + first executive (often CEO/founder) when available.
 */
export async function enrichCompanyFromWebsite(
  website: string,
): Promise<NinjaPearCompany | null> {
  const apiKey = await getNinjaPearApiKey();
  if (!apiKey || !website.trim()) return null;

  try {
    const normalized = website.startsWith("http")
      ? website
      : `https://${website}`;
    const url = new URL("https://nubela.co/api/v1/company/details");
    url.searchParams.set("website", normalized);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      name?: string;
      facebook_url?: string | null;
      instagram_url?: string | null;
      twitter_url?: string | null;
      executives?: Array<{
        name?: string;
        title?: string;
        role?: string;
      }>;
    };

    const exec =
      data.executives?.find((e) =>
        /ceo|founder|owner|president|principal/i.test(
          `${e.title ?? ""} ${e.role ?? ""}`,
        ),
      ) ?? data.executives?.[0];

    return {
      name: data.name ?? null,
      facebookUrl: data.facebook_url ?? null,
      instagramUrl: data.instagram_url ?? null,
      twitterUrl: data.twitter_url ?? null,
      ownerName: exec?.name?.trim() || null,
      ownerTitle: exec?.title || exec?.role || null,
    };
  } catch {
    return null;
  }
}
