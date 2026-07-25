import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS } from "@/lib/admin";
import { getPlanPriceMap, normalizePlan, planLabel, PLAN_IDS } from "@/lib/plans";

const AGENCY_WHERE = {
  role: { notIn: [...ADMIN_STAFF_ROLES] as string[] },
};

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export async function GET() {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [customers, prices, recentBilling] = await Promise.all([
    prisma.user.findMany({
      where: AGENCY_WHERE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        plan: true,
        subscriptionStatus: true,
        creditsRemaining: true,
        createdAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        isActive: true,
      },
    }),
    getPlanPriceMap(),
    prisma.activityLog.findMany({
      where: {
        type: {
          in: ["stripe_subscription_sync", "checkout_abandoned_email"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        type: true,
        message: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
            plan: true,
          },
        },
      },
    }),
  ]);

  const totalCustomers = customers.length;
  const paidActive = customers.filter(
    (c) => c.subscriptionStatus === "active" && c.isActive !== false,
  );
  const trialing = customers.filter((c) => c.subscriptionStatus === "trialing");
  const pastDue = customers.filter((c) => c.subscriptionStatus === "past_due");
  const canceled = customers.filter((c) => c.subscriptionStatus === "canceled");
  const withStripe = customers.filter((c) => Boolean(c.stripeCustomerId));

  const estimatedMrr = money(
    paidActive.reduce(
      (sum, u) => sum + (prices[normalizePlan(u.plan)] ?? 0),
      0,
    ),
  );

  const pipelineMrr = money(
    trialing.reduce(
      (sum, u) => sum + (prices[normalizePlan(u.plan)] ?? 0),
      0,
    ),
  );

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const newCustomers30d = customers.filter(
    (c) => new Date(c.createdAt) >= monthAgo,
  ).length;
  const newPaid30d = paidActive.filter((c) => {
    // Best-effort: customers who are active and have a Stripe subscription
    // created in the last 30 days are counted via activity log below if present.
    return Boolean(c.stripeSubscriptionId);
  }).length;

  const purchasedThisMonth = recentBilling.filter((row) => {
    if (row.type !== "stripe_subscription_sync") return false;
    if (new Date(row.createdAt) < monthAgo) return false;
    try {
      const meta = row.metadata ? JSON.parse(row.metadata) : {};
      return meta.status === "active";
    } catch {
      return false;
    }
  }).length;

  // Per-plan breakdown — always include every product plan so empty plans show 0
  const planBreakdown = PLAN_IDS.map((planId) => {
    const onPlan = customers.filter((c) => normalizePlan(c.plan) === planId);
    // Keep legacy "trial" rows visible only under starter via normalizePlan
    const active = onPlan.filter((c) => c.subscriptionStatus === "active");
    const trial = onPlan.filter((c) => c.subscriptionStatus === "trialing");
    const other = onPlan.filter(
      (c) =>
        c.subscriptionStatus !== "active" &&
        c.subscriptionStatus !== "trialing",
    );
    const price = prices[planId] ?? 0;
    const mrr = money(active.length * price);
    return {
      plan: planId,
      label: planLabel(planId),
      priceMonthly: price,
      totalUsers: onPlan.length,
      activePaid: active.length,
      trialing: trial.length,
      other: other.length,
      mrr,
      sharePct:
        totalCustomers > 0
          ? Math.round((onPlan.length / totalCustomers) * 1000) / 10
          : 0,
      credits: money(
        onPlan.reduce((s, c) => s + (c.creditsRemaining || 0), 0),
      ),
    };
  });

  // Legacy raw plan values still in DB (e.g. "trial") for transparency
  const rawPlanCounts = new Map<string, number>();
  for (const c of customers) {
    rawPlanCounts.set(c.plan, (rawPlanCounts.get(c.plan) ?? 0) + 1);
  }

  const statusMix = ["active", "trialing", "past_due", "canceled"]
    .map((status) => ({
      status,
      count: customers.filter((c) => c.subscriptionStatus === status).length,
    }))
    .concat(
      // Any unexpected statuses
      [
        ...new Set(
          customers
            .map((c) => c.subscriptionStatus)
            .filter(
              (s) =>
                !["active", "trialing", "past_due", "canceled"].includes(s),
            ),
        ),
      ].map((status) => ({
        status,
        count: customers.filter((c) => c.subscriptionStatus === status).length,
      })),
    )
    .filter((s) => s.count > 0);

  return NextResponse.json({
    summary: {
      estimatedMrr,
      pipelineMrr,
      totalCustomers,
      paidActive: paidActive.length,
      trialing: trialing.length,
      pastDue: pastDue.length,
      canceled: canceled.length,
      withStripe: withStripe.length,
      newCustomers30d,
      purchasedThisMonth,
      avgRevenuePerPaid:
        paidActive.length > 0
          ? money(estimatedMrr / paidActive.length)
          : 0,
    },
    planBreakdown,
    statusMix,
    rawPlanCounts: Object.fromEntries(rawPlanCounts),
    prices,
    plans: ADMIN_PLANS,
    // Kept for older UI compatibility
    estimatedMrr,
    planMix: planBreakdown.map((p) => ({
      plan: p.plan,
      count: p.totalUsers,
      credits: p.credits,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      companyName: c.companyName,
      plan: c.plan,
      planNormalized: normalizePlan(c.plan),
      planLabel: planLabel(c.plan),
      subscriptionStatus: c.subscriptionStatus,
      creditsRemaining: money(c.creditsRemaining ?? 0),
      createdAt: c.createdAt,
      hasStripe: Boolean(c.stripeCustomerId),
      hasSubscription: Boolean(c.stripeSubscriptionId),
      monthlyPrice: prices[normalizePlan(c.plan)] ?? 0,
      isPaying:
        c.subscriptionStatus === "active" && Boolean(c.stripeSubscriptionId),
      isActive: c.isActive !== false,
    })),
    recentBilling: recentBilling.map((row) => {
      let meta: Record<string, unknown> = {};
      try {
        meta = row.metadata ? JSON.parse(row.metadata) : {};
      } catch {
        meta = {};
      }
      return {
        id: row.id,
        type: row.type,
        message: row.message,
        createdAt: row.createdAt,
        plan: typeof meta.plan === "string" ? meta.plan : row.user.plan,
        status: typeof meta.status === "string" ? meta.status : null,
        previousPlan:
          typeof meta.previousPlan === "string" ? meta.previousPlan : null,
        user: {
          id: row.user.id,
          email: row.user.email,
          label:
            row.user.companyName || row.user.name || row.user.email,
        },
      };
    }),
    // silence unused for older callers that expected newPaid30d shape
    _meta: { newPaidWithStripe: newPaid30d },
  });
}
