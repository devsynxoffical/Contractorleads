import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS } from "@/lib/admin";

export async function GET() {
  const admin = await requirePermission("overview");
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
    statusGroups,
    recentActivity,
    suspendedCount,
    savedLeadCount,
    savedThisWeek,
    hotLeadCount,
    qualityGroups,
    industryGroups,
    countryGroups,
    geoLeads,
    exportsWeek,
    creditsSpentWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { notIn: [...ADMIN_STAFF_ROLES] } } }),
    prisma.user.count({
      where: {
        role: { notIn: [...ADMIN_STAFF_ROLES] },
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.search.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.search.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.aggregate({
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      _sum: { creditsRemaining: true },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["subscriptionStatus"],
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      _count: { _all: true },
    }),
    prisma.activityLog.findMany({
      take: 12,
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
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] }, isActive: false },
    }),
    prisma.savedLead.count(),
    prisma.savedLead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { qualityTier: "hot" } }),
    prisma.lead.groupBy({
      by: ["qualityTier"],
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["industry"],
      where: { industry: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { industry: "desc" } },
      take: 8,
    }),
    prisma.lead.groupBy({
      by: ["country"],
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 8,
    }),
    prisma.lead.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 180,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        businessName: true,
        address: true,
        latitude: true,
        longitude: true,
        qualityTier: true,
        googleMapsLink: true,
        city: true,
        state: true,
        country: true,
        industry: true,
        leadScore: true,
      },
    }),
    prisma.export.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.creditLedger.aggregate({
      where: {
        createdAt: { gte: weekAgo },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    }),
  ]);

  const dayBuckets: Array<{
    date: string;
    searches: number;
    leads: number;
    saves: number;
  }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const [searches, leads, saves] = await Promise.all([
      prisma.search.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.savedLead.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
    ]);
    dayBuckets.push({
      date: dayStart.toISOString().slice(0, 10),
      searches,
      leads,
      saves,
    });
  }

  const qualityMix = {
    hot: 0,
    warm: 0,
    nurture: 0,
  };
  for (const g of qualityGroups) {
    const key = (g.qualityTier || "nurture").toLowerCase();
    const count = g._count._all;
    if (key === "hot") qualityMix.hot += count;
    else if (key === "warm") qualityMix.warm += count;
    else qualityMix.nurture += count;
  }

  const estimatedMrr = planGroups.reduce((sum, g) => {
    const plan = ADMIN_PLANS.find((p) => p.value === g.plan);
    return sum + (plan?.priceMonthly ?? 0) * g._count._all;
  }, 0);

  const saveRate =
    leadCount > 0
      ? Math.round((savedLeadCount / leadCount) * 1000) / 10
      : 0;

  return NextResponse.json({
    stats: {
      customerCount,
      newCustomersWeek,
      leadCount,
      leadsToday,
      searchesToday,
      searchesWeek,
      creditsOutstanding: creditsAgg._sum.creditsRemaining ?? 0,
      creditsSpentWeek: Math.abs(creditsSpentWeek._sum.amount ?? 0),
      planMix: planGroups.map((g) => ({
        plan: g.plan,
        count: g._count._all,
      })),
      statusMix: statusGroups.map((g) => ({
        status: g.subscriptionStatus,
        count: g._count._all,
      })),
      suspendedCount,
      savedLeadCount,
      savedThisWeek,
      hotLeadCount,
      qualityMix,
      industryMix: industryGroups.map((g) => ({
        industry: g.industry || "Unknown",
        count: g._count._all,
      })),
      countryMix: countryGroups.map((g) => ({
        country: g.country || "US",
        count: g._count._all,
      })),
      last7Days: dayBuckets,
      estimatedMrr,
      exportsWeek,
      saveRate,
      mappedLeadCount: geoLeads.length,
    },
    geoLeads: geoLeads.map((l) => ({
      id: l.id,
      businessName: l.businessName,
      address: l.address,
      latitude: l.latitude as number,
      longitude: l.longitude as number,
      qualityTier: l.qualityTier,
      googleMapsLink: l.googleMapsLink,
      city: l.city,
      state: l.state,
      country: l.country,
      industry: l.industry,
      leadScore: l.leadScore,
    })),
    recentActivity,
  });
}
