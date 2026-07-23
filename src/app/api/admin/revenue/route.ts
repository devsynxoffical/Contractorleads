import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS } from "@/lib/admin";
import { getPlanPriceMap, normalizePlan } from "@/lib/plans";

export async function GET() {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [planGroups, statusGroups, customers, prices] = await Promise.all([
    prisma.user.groupBy({
      by: ["plan"],
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      _count: { _all: true },
      _sum: { creditsRemaining: true },
    }),
    prisma.user.groupBy({
      by: ["subscriptionStatus"],
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        plan: true,
        subscriptionStatus: true,
        creditsRemaining: true,
        createdAt: true,
      },
    }),
    getPlanPriceMap(),
  ]);

  const activePaid = await prisma.user.findMany({
    where: {
      role: { notIn: [...ADMIN_STAFF_ROLES] },
      subscriptionStatus: { in: ["active", "trialing"] },
      plan: { in: ["starter", "growth", "agency", "enterprise"] },
    },
    select: { plan: true },
  });

  const estimatedMrr = activePaid.reduce((sum, u) => {
    return sum + (prices[normalizePlan(u.plan)] ?? 0);
  }, 0);

  return NextResponse.json({
    planMix: planGroups.map((g) => ({
      plan: g.plan,
      count: g._count._all,
      credits: g._sum.creditsRemaining ?? 0,
    })),
    statusMix: statusGroups.map((g) => ({
      status: g.subscriptionStatus,
      count: g._count._all,
    })),
    estimatedMrr: Math.round(estimatedMrr * 100) / 100,
    plans: ADMIN_PLANS,
    customers,
  });
}
