import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWaterfallEnrichCreditCost } from "@/lib/plans";
import { DEFAULT_ORDER, getEnrichmentSettings, orderFor, providerStatuses } from "@/lib/enrichment/registry";
import { ENRICHMENT_TARGETS, TARGET_LABELS } from "@/lib/enrichment/types";

export const dynamic = "force-dynamic";

/** What a customer can choose from: available providers per field, the fee and their balance. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [statuses, settings, feePerRow] = await Promise.all([
    providerStatuses(),
    getEnrichmentSettings(),
    getWaterfallEnrichCreditCost(),
  ]);
  const available = new Set(statuses.filter((s) => s.available).map((s) => s.id));
  const byId = new Map(statuses.map((s) => [s.id, s]));
  return NextResponse.json({
    feePerRow,
    creditsRemaining: user.creditsRemaining,
    targets: ENRICHMENT_TARGETS.map((t) => ({
      id: t,
      label: TARGET_LABELS[t],
      providers: orderFor(t, settings)
        .filter((id) => available.has(id))
        .map((id) => ({ id, name: byId.get(id)!.name, paid: byId.get(id)!.paid, async: byId.get(id)!.async })),
      defaultOrder: DEFAULT_ORDER[t],
    })),
  });
}
