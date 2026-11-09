import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  ADAPTERS,
  DEFAULT_ORDER,
  getEnrichmentSettings,
  providerStatuses,
  saveEnrichmentSettings,
  type EnrichmentSettings,
} from "@/lib/enrichment/registry";
import { ENRICHMENT_TARGETS, type ProviderId } from "@/lib/enrichment/types";

export const dynamic = "force-dynamic";

/** Provider switches and per-field order. Keys themselves are managed in Platform keys. */
export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [providers, settings] = await Promise.all([providerStatuses(), getEnrichmentSettings()]);
  return NextResponse.json({ providers, settings, defaultOrder: DEFAULT_ORDER });
}

export async function PUT(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Partial<EnrichmentSettings>;
  const isId = (x: unknown): x is ProviderId => typeof x === "string" && x in ADAPTERS;
  const next: EnrichmentSettings = {
    disabledProviders: Array.isArray(body.disabledProviders) ? Array.from(new Set(body.disabledProviders.filter(isId))) : [],
    order: {},
  };
  for (const t of ENRICHMENT_TARGETS) {
    const ids = body.order?.[t];
    if (!Array.isArray(ids)) continue;
    const valid = Array.from(new Set(ids.filter(isId))).filter((id) => ADAPTERS[id].targets.includes(t));
    if (valid.length) next.order[t] = valid;
  }
  await saveEnrichmentSettings(next);
  return NextResponse.json({ ok: true, settings: await getEnrichmentSettings(), providers: await providerStatuses() });
}
