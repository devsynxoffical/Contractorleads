import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, addDays, format } from "date-fns";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Week starts Sunday (PRD: Sun–Sat trend)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

  const [
    totalLeads,
    weekLeads,
    savedCount,
    closedCount,
    searchCount,
    exportCount,
    activities,
    industryBreakdown,
    qualitySplit,
    recentSearches,
    recentExports,
    freshUser,
  ] = await Promise.all([
    prisma.lead.count({
      where: { search: { userId: user.id } },
    }),
    prisma.lead.count({
      where: {
        search: { userId: user.id },
        createdAt: { gte: weekStart },
      },
    }),
    prisma.savedLead.count({ where: { userId: user.id } }),
    prisma.savedLead.count({
      where: { userId: user.id, status: "closed" },
    }),
    prisma.search.count({ where: { userId: user.id } }),
    prisma.export.count({ where: { userId: user.id } }),
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.lead.groupBy({
      by: ["industry"],
      where: { search: { userId: user.id }, industry: { not: null } },
      _count: true,
      orderBy: { _count: { industry: "desc" } },
      take: 6,
    }),
    prisma.lead.groupBy({
      by: ["qualityTier"],
      where: { search: { userId: user.id }, qualityTier: { not: null } },
      _count: true,
    }),
    prisma.search.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        industry: true,
        state: true,
        city: true,
        radius: true,
        resultCount: true,
        createdAt: true,
      },
    }),
    prisma.export.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        format: true,
        leadIds: true,
        createdAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsRemaining: true },
    }),
  ]);

  const hot =
    qualitySplit.find((q) => q.qualityTier === "hot")?._count ?? 0;
  const warm =
    qualitySplit.find((q) => q.qualityTier === "warm")?._count ?? 0;
  const nurture =
    qualitySplit.find((q) => q.qualityTier === "nurture")?._count ?? 0;
  const qualityTotal = hot + warm + nurture || 1;

  const dailyLeads = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const dayStart = addDays(weekStart, i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const count = await prisma.lead.count({
        where: {
          search: { userId: user.id },
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });
      return {
        day: format(dayStart, "EEE"),
        count,
      };
    })
  );

  return NextResponse.json({
    stats: {
      totalLeads,
      weekLeads,
      savedCount,
      closedCount,
      searchCount,
      exportCount,
      creditsRemaining: freshUser?.creditsRemaining ?? user.creditsRemaining,
    },
    dailyLeads,
    activities,
    recentSearches,
    recentExports: recentExports.map((e) => ({
      id: e.id,
      format: e.format,
      leadCount: e.leadIds ? e.leadIds.split(",").filter(Boolean).length : 0,
      createdAt: e.createdAt,
    })),
    topIndustries: industryBreakdown.map((i) => ({
      industry: i.industry,
      count: i._count,
    })),
    qualitySplit: {
      hot: Math.round((hot / qualityTotal) * 100),
      warm: Math.round((warm / qualityTotal) * 100),
      nurture: Math.round((nurture / qualityTotal) * 100),
      hotCount: hot,
      warmCount: warm,
      nurtureCount: nurture,
    },
  });
}
