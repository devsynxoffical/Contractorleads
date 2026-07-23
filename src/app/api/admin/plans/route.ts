import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_STAFF_ROLES } from "@/lib/roles";
import {
  ADMIN_PLANS,
  PLAN_API_LIMITS,
  PLAN_FEATURES,
  TEAM_SEAT_LIMITS,
  featuresForPlan,
  getPlanPriceMap,
  normalizePlan,
  planLabel,
  savePlanPriceMap,
} from "@/lib/plans";

export async function GET() {
  const admin = await requirePermission("plans");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staffFilter = { role: { notIn: [...ADMIN_STAFF_ROLES] } };
  const [groups, prices] = await Promise.all([
    prisma.user.groupBy({
      by: ["plan"],
      where: staffFilter,
      _count: { _all: true },
      _sum: { creditsRemaining: true },
    }),
    getPlanPriceMap(),
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

/** Update monthly list prices (used for referral commission base). */
export async function PATCH(request: Request) {
  const admin = await requirePermission("plans");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const prices = body.prices;
  if (!prices || typeof prices !== "object") {
    return NextResponse.json(
      { error: "prices object is required" },
      { status: 400 },
    );
  }

  const next = await savePlanPriceMap(prices as Record<string, number>);
  return NextResponse.json({ prices: next });
}
