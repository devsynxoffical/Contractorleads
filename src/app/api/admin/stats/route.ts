import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    customerCount,
    newCustomersWeek,
    leadCount,
    leadsToday,
    searchesToday,
    searchesWeek,
    creditsAgg,
    planGroups,
    recentActivity,
    suspendedCount,
    savedLeadCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.user.count({
      where: {
        role: { not: "SUPER_ADMIN" },
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.search.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.search.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.aggregate({
      where: { role: { not: "SUPER_ADMIN" } },
      _sum: { creditsRemaining: true },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      where: { role: { not: "SUPER_ADMIN" } },
      _count: { _all: true },
    }),
    prisma.activityLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: { role: { not: "SUPER_ADMIN" }, isActive: false },
    }),
    prisma.savedLead.count(),
  ]);

  const dayBuckets: Array<{ date: string; searches: number; leads: number }> =
    [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const [searches, leads] = await Promise.all([
      prisma.search.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
    ]);
    dayBuckets.push({
      date: dayStart.toISOString().slice(0, 10),
      searches,
      leads,
    });
  }

  return NextResponse.json({
    stats: {
      customerCount,
      newCustomersWeek,
      leadCount,
      leadsToday,
      searchesToday,
      searchesWeek,
      creditsOutstanding: creditsAgg._sum.creditsRemaining ?? 0,
      planMix: planGroups.map((g) => ({
        plan: g.plan,
        count: g._count._all,
      })),
      suspendedCount,
      savedLeadCount,
      last7Days: dayBuckets,
    },
    recentActivity,
  });
}
