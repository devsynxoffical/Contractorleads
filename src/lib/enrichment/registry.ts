import { prisma } from "@/lib/prisma";
import { resolvePlatformKey } from "@/lib/platform-keys";
import { apolloAdapter } from "./adapters/apollo";
import { findymailAdapter } from "./adapters/findymail";
import { webSearchAdapter, websiteAdapter } from "./adapters/first-party";
import { hunterAdapter } from "./adapters/hunter";
import { icypeasAdapter } from "./adapters/icypeas";
import { leadmagicAdapter } from "./adapters/leadmagic";
import { ninjapearAdapter } from "./adapters/ninjapear";
import { prospeoAdapter } from "./adapters/prospeo";
import type { EnrichmentTarget, ProviderAdapter, ProviderId } from "./types";

/**
 * Provider registry. New licensed APIs are added here without changing the orchestrator.
 * Order within each track is the proposed starting order from the blueprint: free sources
 * first, then existing providers, then the new additions. Reorder after the pilot based on
 * measured incremental accepted contacts per dollar, not advertised database size.
 */
export const ADAPTERS: Record<ProviderId, ProviderAdapter> = {
  website: websiteAdapter,
  web_search: webSearchAdapter,
  apollo: apolloAdapter,
  hunter: hunterAdapter,
  prospeo: prospeoAdapter,
  ninjapear: ninjapearAdapter,
  findymail: findymailAdapter,
  leadmagic: leadmagicAdapter,
  icypeas: icypeasAdapter,
};

export const DEFAULT_ORDER: Record<EnrichmentTarget, ProviderId[]> = {
  owner: ["website", "web_search", "apollo", "hunter", "ninjapear"],
  work_email: ["website", "apollo", "hunter", "prospeo", "findymail", "leadmagic", "icypeas"],
  phone: ["web_search"],
  mobile: ["prospeo"],
};

export type EnrichmentSettings = {
  /** Providers an admin has switched off platform-wide */
  disabledProviders: ProviderId[];
  /** Optional per-track order override */
  order: Partial<Record<EnrichmentTarget, ProviderId[]>>;
};

const DEFAULT_SETTINGS: EnrichmentSettings = { disabledProviders: [], order: {} };

/** Stored next to the platform keys in the admin-managed config row. */
export async function getEnrichmentSettings(): Promise<EnrichmentSettings> {
  const row = await prisma.planPricingConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  if (!row?.pricesJson) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.pricesJson) as { _enrichment?: Partial<EnrichmentSettings> };
    const e = parsed._enrichment ?? {};
    const valid = (ids: unknown): ProviderId[] =>
      Array.isArray(ids) ? ids.filter((x): x is ProviderId => typeof x === "string" && x in ADAPTERS) : [];
    const order: EnrichmentSettings["order"] = {};
    for (const t of Object.keys(DEFAULT_ORDER) as EnrichmentTarget[]) {
      const o = valid(e.order?.[t]).filter((id) => ADAPTERS[id].targets.includes(t));
      if (o.length) order[t] = o;
    }
    return { disabledProviders: valid(e.disabledProviders), order };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveEnrichmentSettings(next: EnrichmentSettings): Promise<void> {
  const row = await prisma.planPricingConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  let obj: Record<string, unknown> = {};
  try {
    obj = row?.pricesJson ? (JSON.parse(row.pricesJson) as Record<string, unknown>) : {};
  } catch {
    obj = {};
  }
  obj._enrichment = next;
  await prisma.planPricingConfig.upsert({
    where: { id: "default" },
    update: { pricesJson: JSON.stringify(obj) },
    create: { id: "default", pricesJson: JSON.stringify(obj) },
  });
}

export type ProviderStatus = {
  id: ProviderId;
  name: string;
  paid: boolean;
  async: boolean;
  targets: EnrichmentTarget[];
  /** Key configured (always true for free sources) */
  configured: boolean;
  /** Admin switch */
  enabled: boolean;
  /** Usable in a job right now */
  available: boolean;
  docsUrl: string;
  version: string;
};

export async function providerStatuses(): Promise<ProviderStatus[]> {
  const settings = await getEnrichmentSettings();
  const out: ProviderStatus[] = [];
  for (const a of Object.values(ADAPTERS)) {
    const configured = a.keyField ? Boolean((await resolvePlatformKey(a.keyField)).trim()) : true;
    const enabled = !settings.disabledProviders.includes(a.id);
    out.push({
      id: a.id,
      name: a.name,
      paid: a.paid,
      async: a.async,
      targets: a.targets,
      configured,
      enabled,
      available: configured && enabled,
      docsUrl: a.docsUrl,
      version: a.version,
    });
  }
  return out;
}

/** Ordered provider list for a track, using an optional job-level order, admin order, then default. */
export function orderFor(
  target: EnrichmentTarget,
  settings: EnrichmentSettings,
  jobOrder?: Partial<Record<EnrichmentTarget, ProviderId[]>>,
): ProviderId[] {
  const base = jobOrder?.[target]?.length ? jobOrder[target]! : settings.order[target] ?? DEFAULT_ORDER[target];
  return base.filter(
    (id) => ADAPTERS[id] && ADAPTERS[id].targets.includes(target) && !settings.disabledProviders.includes(id),
  );
}
