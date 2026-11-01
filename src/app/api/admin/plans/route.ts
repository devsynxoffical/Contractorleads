import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_STAFF_ROLES } from "@/lib/roles";
import {
  ADMIN_PLANS,
  PLAN_API_LIMITS,
  PLAN_FEATURES,
  PLAN_MONTHLY_CREDITS,
  STARTER_FREE_CREDITS,
  TEAM_SEAT_LIMITS,
  featuresForPlan,
  getPlanPriceMap,
  getWaterfallEnrichCreditCost,
  monthlyCreditsForPlan,
  normalizePlan,
  planLabel,
  savePlanPriceMap,
  saveWaterfallEnrichCreditCost,
} from "@/lib/plans";
import { CREDIT_COSTS } from "@/lib/constants";

export async function GET() {
  const admin = await requirePermission("plans");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staffFilter = { role: { notIn: [...ADMIN_STAFF_ROLES] } };
  const [groups, prices, waterfallEnrichCost] = await Promise.all([
    prisma.user.groupBy({
      by: ["plan"],
      where: staffFilter,
      _count: { _all: true },
      _sum: { creditsRemaining: true },
    }),
    getPlanPriceMap(),
    getWaterfallEnrichCreditCost(),
  ]);

  const byPlan = Object.fromEntries(
    groups.map((g) => [normalizePlan(g.plan), g]),
  );

  const plans = ADMIN_PLANS.map((p) => {
    const row = byPlan[p.value];
    return {
      id: p.value,
      label: p.label,
      priceMonthly: prices[p.value] ?? p.priceMonthly,
      customers: row?._count._all ?? 0,
      creditsOutstanding: row?._sum.creditsRemaining ?? 0,
      monthlyCredits: monthlyCreditsForPlan(p.value),
      monthlyLeads: monthlyCreditsForPlan(p.value),
      apiMonthlyLimit: PLAN_API_LIMITS[p.value],
      teamSeats: TEAM_SEAT_LIMITS[p.value],
      features: PLAN_FEATURES[p.value],
    };
  });

  const legacy = groups.filter(
    (g) =>
      !ADMIN_PLANS.some((p) => p.value === normalizePlan(g.plan)) ||
      g.plan === "pro",
  );

  return NextResponse.json({
    plans,
    prices,
    creditCosts: {
      lead: CREDIT_COSTS.lead,
      assistant: CREDIT_COSTS.assistant,
      outreach: CREDIT_COSTS.outreach,
      starterFreeCredits: STARTER_FREE_CREDITS,
      waterfallEnrich: waterfallEnrichCost,
    },
    planMonthlyCredits: PLAN_MONTHLY_CREDITS,
    featureKeys: Object.keys(PLAN_FEATURES.agency) as Array<
      keyof ReturnType<typeof featuresForPlan>
    >,
    legacy: legacy.map((g) => ({
      plan: g.plan,
      label: planLabel(g.plan),
      count: g._count._all,
    })),
  });
}

/** Update monthly list prices and waterfall enrichment credit fee. */
export async function PATCH(request: Request) {
  const admin = await requirePermission("plans");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const prices = body.prices;
  const waterfallEnrichCost = body.waterfallEnrichCost;

  if ((!prices || typeof prices !== "object") && waterfallEnrichCost === undefined) {
    return NextResponse.json(
      { error: "prices object or waterfallEnrichCost is required" },
      { status: 400 },
    );
  }

  const next =
    prices && typeof prices === "object"
      ? await savePlanPriceMap(prices as Record<string, number>)
      : await getPlanPriceMap();

  const savedWaterfallCost =
    waterfallEnrichCost !== undefined && Number.isFinite(Number(waterfallEnrichCost))
      ? await saveWaterfallEnrichCreditCost(Number(waterfallEnrichCost))
      : await getWaterfallEnrichCreditCost();

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  revalidatePath("/pricing");
  revalidatePath("/billing");

  return NextResponse.json({
    prices: next,
    waterfallEnrichCost: savedWaterfallCost,
  });
}
