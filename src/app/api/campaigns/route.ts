import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  prepareCampaignProspects,
  parseCampaignHooks,
  parseCampaignSteps,
  DEFAULT_DAY0_HOOKS,
  DEFAULT_FOLLOWUP_SEQUENCE,
} from "@/lib/campaign-engine";
import { processCampaignSends } from "@/lib/campaign-runner";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      segment: {
        select: { id: true, name: true, industry: true },
      },
      _count: {
        select: {
          prospects: true,
          logs: true,
        },
      },
    },
  });

  // Fetch campaign aggregate metrics
  const campaignIds = campaigns.map((c) => c.id);
  const [prospectStats, logStats] = await Promise.all([
    prisma.campaignProspect.groupBy({
      by: ["campaignId", "status"],
      where: { campaignId: { in: campaignIds } },
      _count: { _all: true },
    }),
    prisma.campaignLog.groupBy({
      by: ["campaignId", "status"],
      where: { campaignId: { in: campaignIds } },
      _count: { _all: true },
    }),
  ]);

  const statsMap = new Map<
    string,
    {
      total: number;
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
      bounced: number;
      unsubscribed: number;
      pending: number;
      inProgress: number;
      completed: number;
    }
  >();

  for (const c of campaigns) {
    statsMap.set(c.id, {
      total: c._count.prospects,
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    });
  }

  for (const p of prospectStats) {
    const s = statsMap.get(p.campaignId);
    if (!s) continue;
    const count = p._count._all;
    if (p.status === "pending") s.pending += count;
    if (p.status === "in_progress") {
      s.inProgress += count;
      s.sent += count;
    }
    if (p.status === "completed") {
      s.completed += count;
      s.sent += count;
    }
    if (p.status === "replied") {
      s.replied += count;
      s.sent += count;
    }
    if (p.status === "bounced") {
      s.bounced += count;
      s.sent += count;
    }
    if (p.status === "unsubscribed") {
      s.unsubscribed += count;
      s.sent += count;
    }
  }

  for (const l of logStats) {
    const s = statsMap.get(l.campaignId);
    if (!s) continue;
    const count = l._count._all;
    if (l.status === "opened") s.opened += count;
    if (l.status === "clicked") s.clicked += count;
  }

  const enriched = campaigns.map((c) => {
    const s = statsMap.get(c.id) || {
      total: c._count.prospects,
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      industry: c.industry,
      country: c.country,
      state: c.state,
      city: c.city,
      timezone: c.timezone,
      useRecipientTimezone: c.useRecipientTimezone,
      scheduledStartDate: c.scheduledStartDate,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
      createdAt: c.createdAt,
      segment: c.segment,
      leadCount: c.leadCount || s.total,
      uniqueEmailCount: c.uniqueEmailCount || s.total,
      duplicateDetectedCount: c.duplicateDetectedCount,
      stats: s,
    };
  });

  return NextResponse.json({ campaigns: enriched });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name,
      segmentId,
      leadIds,
      industry,
      country = "US",
      state,
      city,
      hooks,
      steps,
      selectedMailboxIds = "ALL",
      dailyLimitPerMailbox = 10,
      mailboxLimits,
      minDelayMinutes = 4,
      maxDelayMinutes = 7,
      timezone = "America/New_York",
      useRecipientTimezone = true,
      sendingDays = ["mon", "tue", "wed", "thu", "fri"],
      sendingWindowStart = "09:00",
      sendingWindowEnd = "17:00",
      scheduleType = "launch_now", // "launch_now" | "schedule" | "draft"
      scheduledStartDate,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    // Resolve leads for this campaign
    let rawLeads: Array<{
      id?: string;
      businessName: string;
      ownerName?: string | null;
      email?: string | null;
      phone?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
    }> = [];

    let resolvedIndustry = industry || null;
    let resolvedState = state || null;
    let resolvedCity = city || null;
    let resolvedCountry = country || "US";

    if (segmentId) {
      const segment = await prisma.leadSegment.findUnique({
        where: { id: segmentId, userId: user.id },
      });
      if (segment) {
        resolvedIndustry = resolvedIndustry || segment.industry;
        resolvedState = resolvedState || segment.state;
        resolvedCity = resolvedCity || segment.city;
        resolvedCountry = resolvedCountry || segment.country || "US";

        if (segment.leadIdsJson) {
          try {
            const parsedIds = JSON.parse(segment.leadIdsJson);
            if (Array.isArray(parsedIds) && parsedIds.length > 0) {
              const leadsFromDb = await prisma.lead.findMany({
                where: { id: { in: parsedIds } },
              });
              rawLeads = leadsFromDb;
            }
          } catch {
            /* ignore */
          }
        }

        if (rawLeads.length === 0) {
          // Query leads matching segment filters
          const whereClause: Record<string, unknown> = {};
          if (segment.industry && segment.industry !== "all") {
            whereClause.industry = { contains: segment.industry, mode: "insensitive" };
          }
          if (segment.country) whereClause.country = segment.country;
          if (segment.state) whereClause.state = segment.state;
          if (segment.city) whereClause.city = { contains: segment.city, mode: "insensitive" };

          const matching = await prisma.lead.findMany({
            where: whereClause,
            take: 2500,
            orderBy: { createdAt: "desc" },
          });
          rawLeads = matching;
        }
      }
    } else if (Array.isArray(leadIds) && leadIds.length > 0) {
      const leadsFromDb = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
      });
      rawLeads = leadsFromDb;
    } else if (body.leads && Array.isArray(body.leads)) {
      rawLeads = body.leads;
    }

    const campaignHooks = Array.isArray(hooks) && hooks.length > 0 ? hooks : DEFAULT_DAY0_HOOKS;
    const campaignSteps = Array.isArray(steps) && steps.length > 0 ? steps : DEFAULT_FOLLOWUP_SEQUENCE;

    // Deduplicate leads by email and assign hooks + timezones
    const prepared = prepareCampaignProspects(rawLeads, campaignHooks);

    if (prepared.prospects.length === 0) {
      return NextResponse.json(
        { error: "No valid leads with email addresses were found to add to this campaign." },
        { status: 400 }
      );
    }

    let initialStatus = "draft";
    let scheduledDateObj: Date | null = null;
    let startedDateObj: Date | null = null;

    if (scheduleType === "launch_now") {
      initialStatus = "active";
      startedDateObj = new Date();
    } else if (scheduleType === "schedule") {
      initialStatus = "scheduled";
      scheduledDateObj = scheduledStartDate ? new Date(scheduledStartDate) : new Date();
    }

    // Create campaign in DB
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: name.trim(),
        status: initialStatus,
        segmentId: segmentId || null,
        industry: resolvedIndustry,
        country: resolvedCountry,
        state: resolvedState,
        city: resolvedCity,
        leadCount: prepared.totalRawCount,
        duplicateDetectedCount: prepared.duplicateCount,
        uniqueEmailCount: prepared.uniqueEmailCount,
        hooksJson: JSON.stringify(campaignHooks),
        stepsJson: JSON.stringify(campaignSteps),
        selectedMailboxIds: typeof selectedMailboxIds === "string" ? selectedMailboxIds : JSON.stringify(selectedMailboxIds),
        dailyLimitPerMailbox: Math.max(1, Number(dailyLimitPerMailbox) || 10),
        mailboxLimitsJson: mailboxLimits ? JSON.stringify(mailboxLimits) : null,
        minDelayMinutes: Math.max(1, Number(minDelayMinutes) || 4),
        maxDelayMinutes: Math.max(minDelayMinutes, Number(maxDelayMinutes) || 7),
        timezone,
        useRecipientTimezone: Boolean(useRecipientTimezone),
        sendingDaysJson: JSON.stringify(sendingDays),
        sendingWindowStart: sendingWindowStart || "09:00",
        sendingWindowEnd: sendingWindowEnd || "17:00",
        scheduledStartDate: scheduledDateObj,
        startedAt: startedDateObj,
      },
    });

    // Create prospects in bulk
    await prisma.campaignProspect.createMany({
      data: prepared.prospects.map((p) => ({
        campaignId: campaign.id,
        leadId: p.leadId || null,
        businessName: p.businessName,
        ownerName: p.ownerName || null,
        email: p.email,
        phone: p.phone || null,
        city: p.city || null,
        state: p.state || null,
        country: p.country,
        timezone: p.timezone,
        status: "pending",
        assignedHookId: p.assignedHookId,
        currentStepIndex: 0,
      })),
    });

    // If launch_now, trigger immediate initial send cycle
    if (initialStatus === "active") {
      void processCampaignSends({ campaignId: campaign.id, userId: user.id });
    }

    return NextResponse.json({
      ok: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        leadCount: prepared.totalRawCount,
        uniqueEmailCount: prepared.uniqueEmailCount,
        duplicateDetectedCount: prepared.duplicateCount,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create campaign";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
