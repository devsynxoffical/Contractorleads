import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, addDays, format } from "date-fns";
import { processDueEnrollments } from "@/lib/email-automation";
import { LEAD_STATUSES } from "@/lib/constants";
import { normalizeCountryCode, resolveLeadCoords } from "@/lib/geo";
import { getUnlockedLeadIds } from "@/lib/lead-access";
import { planHasFeature } from "@/lib/plans";
import { isSubscriptionEntitled } from "@/lib/plan-access";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Heartbeat: advance Day 2/3 emails when the user is active (no external cron required)
  void processDueEnrollments({ userId: user.id, take: 10 });

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
    pipelineByStatus,
    smtpSettings,
    emailSequence,
    qualitySample,
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
        country: true,
        locationScope: true,
        state: true,
        city: true,
        zip: true,
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
      select: {
        creditsRemaining: true,
        crmWebhookUrl: true,
        crmWebhookEnabled: true,
        slackWebhookUrl: true,
        slackEnabled: true,
        ghlWebhookUrl: true,
        ghlEnabled: true,
        onboardingComplete: true,
        apiEnabled: true,
        mcpEnabled: true,
        ssoEnabled: true,
        apiKeyLast4: true,
      },
    }),
    prisma.savedLead.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: true,
    }),
    prisma.smtpAccount.findFirst({
      where: { userId: user.id, enabled: true },
      select: { id: true, fromEmail: true },
    }),
    prisma.emailSequence.findUnique({
      where: { userId: user.id },
      select: { enabled: true },
    }),
    prisma.lead.findMany({
      where: { search: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        leadScore: true,
        qualityTier: true,
        ownerName: true,
        linkedinUrl: true,
        linkedinCompanyUrl: true,
        linkedinOwnerUrl: true,
        facebook: true,
        instagram: true,
        youtube: true,
        tiktok: true,
      },
    }),
  ]);

  const hot =
    qualitySplit.find((q) => q.qualityTier === "hot")?._count ?? 0;
  const warm =
    qualitySplit.find((q) => q.qualityTier === "warm")?._count ?? 0;
  const nurture =
    qualitySplit.find((q) => q.qualityTier === "nurture")?._count ?? 0;
  const qualityTotal = hot + warm + nurture || 1;

  const validPipelineStatuses = new Set<string>(LEAD_STATUSES.map((s) => s.value));
  const pipeline = {
    new: 0,
    contacted: 0,
    qualified: 0,
    closed: 0,
  };
  for (const row of pipelineByStatus) {
    if (validPipelineStatuses.has(row.status)) {
      pipeline[row.status as keyof typeof pipeline] = row._count;
    } else {
      pipeline.new += row._count;
    }
  }

  const facebookConfigured = Boolean(
    process.env.FACEBOOK_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN,
  );
  const placesConfigured = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  const yelpConfigured = Boolean(process.env.YELP_FUSION_API_KEY);
  const linkedinConfigured = Boolean(
    process.env.SERPER_API_KEY ||
      process.env.NINJAPEAR_API_KEY ||
      process.env.LINKEDIN_DATA_API_KEY,
  );

  const weekEnd = addDays(weekStart, 7);
  const weekLeadDates = await prisma.lead.findMany({
    where: {
      search: { userId: user.id },
      createdAt: { gte: weekStart, lt: weekEnd },
    },
    select: { createdAt: true },
  });

  const dailyLeads = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = addDays(weekStart, i);
    const dayKey = format(dayStart, "yyyy-MM-dd");
    const count = weekLeadDates.filter(
      (l) => format(l.createdAt, "yyyy-MM-dd") === dayKey
    ).length;
    return {
      day: format(dayStart, "EEE"),
      count,
    };
  });

  function exportLeadCount(raw: string | null): number {
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).length;
    } catch {
      // Legacy comma-separated storage
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean).length;
  }

  const qualityRows = qualitySample.length || 1;
  const avgLeadScore = Math.round(
    qualitySample.reduce((sum, row) => sum + (row.leadScore || 0), 0) / qualityRows,
  );
  const completeProfiles = qualitySample.filter((row) => {
    const hasOwner = Boolean(row.ownerName?.trim());
    const hasLinkedIn = Boolean(
      row.linkedinUrl || row.linkedinCompanyUrl || row.linkedinOwnerUrl,
    );
    const hasSocial = Boolean(
      row.facebook || row.instagram || row.youtube || row.tiktok,
    );
    return hasOwner && hasLinkedIn && hasSocial;
  }).length;
  const completeProfileRate = Math.round((completeProfiles / qualityRows) * 100);
  const hotRate = Math.round(
    (qualitySample.filter((row) => row.qualityTier === "hot").length / qualityRows) * 100,
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
    pipeline,
    integrations: {
      crmWebhook: {
        connected: Boolean(freshUser?.crmWebhookUrl && freshUser?.crmWebhookEnabled),
        enabled: Boolean(freshUser?.crmWebhookEnabled),
        hasUrl: Boolean(freshUser?.crmWebhookUrl),
      },
      slack: {
        connected: Boolean(freshUser?.slackWebhookUrl && freshUser?.slackEnabled),
        enabled: Boolean(freshUser?.slackEnabled),
        hasUrl: Boolean(freshUser?.slackWebhookUrl),
      },
      ghl: {
        connected: Boolean(freshUser?.ghlWebhookUrl && freshUser?.ghlEnabled),
        enabled: Boolean(freshUser?.ghlEnabled),
        hasUrl: Boolean(freshUser?.ghlWebhookUrl),
      },
      emailAutomation: {
        smtpConfigured: Boolean(smtpSettings?.fromEmail || smtpSettings?.id),
        sequenceEnabled: Boolean(emailSequence?.enabled),
      },
      apiAccess: {
        apiEnabled: Boolean(freshUser?.apiEnabled),
        mcpEnabled: Boolean(freshUser?.mcpEnabled),
        ssoEnabled: Boolean(freshUser?.ssoEnabled),
        hasKey: Boolean(freshUser?.apiKeyLast4),
      },
      facebook: {
        configured: facebookConfigured,
        customAudience: false,
      },
      dataSources: {
        googlePlaces: placesConfigured,
        yelp: yelpConfigured,
        linkedin: linkedinConfigured,
      },
      exports: {
        csv: true,
        excel: true,
        pdf: false,
      },
      onboardingComplete: Boolean(freshUser?.onboardingComplete),
    },
    dailyLeads,
    activities,
    recentSearches,
    recentExports: recentExports.map((e) => ({
      id: e.id,
      format: e.format,
      leadCount: exportLeadCount(e.leadIds),
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
    qualityHealth: {
      sampleSize: qualitySample.length,
      avgLeadScore,
      completeProfileRate,
      hotRate,
      placesScannedRecent: recentSearches.reduce((n, s) => n + (s.resultCount || 0), 0),
    },
    map: await (async () => {
      const mapAllowed =
        planHasFeature(user.plan, "map") &&
        isSubscriptionEntitled(user.subscriptionStatus, user.plan);
      if (!mapAllowed) {
        return { allowed: false as const, leads: [], lockedCount: 0 };
      }
      const rows = await prisma.lead.findMany({
        where: { search: { userId: user.id } },
        take: 200,
        orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
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
      });
      const unlocked = await getUnlockedLeadIds(
        user.id,
        rows.map((l) => l.id),
      );
      const leads = [];
      for (const l of rows) {
        if (!unlocked.has(l.id)) continue;
        const coords = resolveLeadCoords(l);
        if (!coords) continue;
        leads.push({
          id: l.id,
          businessName: l.businessName,
          address: l.address,
          latitude: coords.latitude,
          longitude: coords.longitude,
          qualityTier: l.qualityTier,
          googleMapsLink: l.googleMapsLink,
          city: l.city,
          state: l.state,
          country: normalizeCountryCode(l.country),
          industry: l.industry,
          leadScore: l.leadScore,
        });
      }
      return {
        allowed: true as const,
        leads,
        lockedCount: rows.length - unlocked.size,
      };
    })(),
  });
}
