import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  parseCampaignHooks,
  parseCampaignSteps,
  type CampaignHook,
  type CampaignFollowUpStep,
} from "@/lib/campaign-engine";
import { processCampaignSends } from "@/lib/campaign-runner";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id, userId: user.id },
    include: {
      segment: {
        select: { id: true, name: true, industry: true, leadCount: true },
      },
      prospects: {
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          country: true,
          timezone: true,
          status: true,
          assignedHookId: true,
          currentStepIndex: true,
          lastSentAt: true,
          nextSendDueAt: true,
          lastFromEmail: true,
          lastSubject: true,
          openedAt: true,
          openCount: true,
          clickedAt: true,
          clickCount: true,
          repliedAt: true,
          bouncedAt: true,
          unsubscribedAt: true,
          stopReason: true,
          createdAt: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Aggregate prospect statuses
  const prospectGroups = await prisma.campaignProspect.groupBy({
    by: ["status"],
    where: { campaignId: id },
    _count: { _all: true },
  });

  const statusCounts: Record<string, number> = {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    replied: 0,
    bounced: 0,
    unsubscribed: 0,
    failed: 0,
    paused: 0,
  };

  for (const g of prospectGroups) {
    const c = g._count._all;
    statusCounts.total += c;
    if (statusCounts[g.status] !== undefined) {
      statusCounts[g.status] += c;
    }
  }

  // Aggregate logs for opens, clicks, replies, and mailbox/hook breakdowns
  const [logs, hookProspectGroups, userMailboxes, systemMailboxes] = await Promise.all([
    prisma.campaignLog.findMany({
      where: { campaignId: id },
      select: {
        id: true,
        stepIndex: true,
        hookId: true,
        mailboxId: true,
        fromEmail: true,
        toEmail: true,
        subject: true,
        status: true,
        openedAt: true,
        clickedAt: true,
        repliedAt: true,
        bouncedAt: true,
        sentAt: true,
      },
      orderBy: { sentAt: "desc" },
      take: 1000,
    }),
    prisma.campaignProspect.groupBy({
      by: ["assignedHookId"],
      where: { campaignId: id },
      _count: { _all: true },
    }),
    prisma.smtpAccount.findMany({
      where: { userId: user.id },
    }),
    prisma.systemSmtpAccount.findMany({
      where: { enabled: true },
    }),
  ]);

  const hooks = parseCampaignHooks(campaign.hooksJson);
  const steps = parseCampaignSteps(campaign.stepsJson);

  // Hook-by-hook performance analytics
  const hookStatsMap = new Map<
    string,
    {
      hookId: string;
      label: string;
      assignedProspects: number;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      replied: number;
      bounced: number;
    }
  >();

  for (const h of hooks) {
    hookStatsMap.set(h.id, {
      hookId: h.id,
      label: h.label,
      assignedProspects: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
    });
  }

  for (const g of hookProspectGroups) {
    if (g.assignedHookId && hookStatsMap.has(g.assignedHookId)) {
      hookStatsMap.get(g.assignedHookId)!.assignedProspects = g._count._all;
    }
  }

  // Step-by-step performance analytics
  const stepStatsMap = new Map<
    number,
    {
      stepIndex: number;
      label: string;
      sent: number;
      delivered: number;
      opened: number;
      replied: number;
      bounced: number;
    }
  >();

  stepStatsMap.set(0, {
    stepIndex: 0,
    label: "Day 0 (Initial Outreach)",
    sent: 0,
    delivered: 0,
    opened: 0,
    replied: 0,
    bounced: 0,
  });

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    stepStatsMap.set(i + 1, {
      stepIndex: i + 1,
      label: s.label || `Follow-Up ${i + 1}`,
      sent: 0,
      delivered: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
    });
  }

  // Mailbox performance analytics
  const mailboxStatsMap = new Map<
    string,
    {
      id: string;
      email: string;
      domain: string;
      label: string;
      sentToday: number;
      totalSent: number;
      delivered: number;
      bounced: number;
      opened: number;
      replied: number;
    }
  >();

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  for (const log of logs) {
    // Hook stats
    if (log.hookId && hookStatsMap.has(log.hookId)) {
      const hs = hookStatsMap.get(log.hookId)!;
      hs.sent++;
      if (log.status !== "failed" && log.status !== "bounced") hs.delivered++;
      if (log.openedAt || log.status === "opened") hs.opened++;
      if (log.clickedAt || log.status === "clicked") hs.clicked++;
      if (log.repliedAt || log.status === "replied") hs.replied++;
      if (log.bouncedAt || log.status === "bounced") hs.bounced++;
    }

    // Step stats
    if (stepStatsMap.has(log.stepIndex)) {
      const ss = stepStatsMap.get(log.stepIndex)!;
      ss.sent++;
      if (log.status !== "failed" && log.status !== "bounced") ss.delivered++;
      if (log.openedAt || log.status === "opened") ss.opened++;
      if (log.repliedAt || log.status === "replied") ss.replied++;
      if (log.bouncedAt || log.status === "bounced") ss.bounced++;
    }

    // Mailbox stats
    const mbKey = log.mailboxId || log.fromEmail;
    let ms = mailboxStatsMap.get(mbKey);
    if (!ms) {
      ms = {
        id: log.mailboxId || log.fromEmail,
        email: log.fromEmail,
        domain: log.fromEmail.split("@")[1] || "unknown",
        label: log.fromEmail,
        sentToday: 0,
        totalSent: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        replied: 0,
      };
      mailboxStatsMap.set(mbKey, ms);
    }
    if (log.status !== "failed") {
      ms.totalSent++;
      if (new Date(log.sentAt) >= startOfToday) ms.sentToday++;
    }
    if (log.status !== "failed" && log.status !== "bounced") ms.delivered++;
    if (log.bouncedAt || log.status === "bounced") ms.bounced++;
    if (log.openedAt || log.status === "opened") ms.opened++;
    if (log.repliedAt || log.status === "replied") ms.replied++;
  }

  const hookPerformance = Array.from(hookStatsMap.values()).map((h) => ({
    ...h,
    openRate: h.delivered > 0 ? Math.round((h.opened / h.delivered) * 100) : 0,
    clickRate: h.delivered > 0 ? Math.round((h.clicked / h.delivered) * 100) : 0,
    replyRate: h.delivered > 0 ? Math.round((h.replied / h.delivered) * 100) : 0,
    bounceRate: h.sent > 0 ? Math.round((h.bounced / h.sent) * 100) : 0,
  }));

  const stepPerformance = Array.from(stepStatsMap.values()).map((s) => ({
    ...s,
    openRate: s.delivered > 0 ? Math.round((s.opened / s.delivered) * 100) : 0,
    replyRate: s.delivered > 0 ? Math.round((s.replied / s.delivered) * 100) : 0,
  }));

  // Match all connected mailboxes
  const allKnownMailboxes = [
    ...userMailboxes.map((u) => ({
      id: u.id,
      email: u.fromEmail,
      label: u.label || u.fromEmail,
      domain: u.fromEmail.split("@")[1] || "custom",
      enabled: u.enabled,
    })),
    ...systemMailboxes.map((s) => ({
      id: s.id,
      email: s.fromEmail,
      label: s.fromName ? `${s.fromName} (${s.fromEmail})` : s.fromEmail,
      domain: s.domain || s.fromEmail.split("@")[1] || "hostinger",
      enabled: s.enabled,
    })),
  ];

  let selectedIds: string[] | "ALL" = "ALL";
  try {
    if (campaign.selectedMailboxIds && campaign.selectedMailboxIds !== '"ALL"') {
      selectedIds = JSON.parse(campaign.selectedMailboxIds);
    }
  } catch {
    selectedIds = "ALL";
  }

  let customLimitsMap: Record<string, number> = {};
  try {
    if (campaign.mailboxLimitsJson) {
      customLimitsMap = JSON.parse(campaign.mailboxLimitsJson);
    }
  } catch {
    customLimitsMap = {};
  }

  const mailboxPerformance = allKnownMailboxes
    .filter((mb) => {
      if (selectedIds === "ALL") return true;
      if (Array.isArray(selectedIds)) return selectedIds.includes(mb.id) || selectedIds.includes(mb.email);
      return true;
    })
    .map((mb) => {
      const stats = mailboxStatsMap.get(mb.id) || mailboxStatsMap.get(mb.email) || {
        sentToday: 0,
        totalSent: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        replied: 0,
      };
      const limit = customLimitsMap[mb.id] ?? campaign.dailyLimitPerMailbox ?? 10;
      const bounceRate = stats.totalSent > 0 ? Math.round((stats.bounced / stats.totalSent) * 100) : 0;
      const replyRate = stats.delivered > 0 ? Math.round((stats.replied / stats.delivered) * 100) : 0;
      return {
        id: mb.id,
        email: mb.email,
        domain: mb.domain,
        label: mb.label,
        enabled: mb.enabled,
        dailyLimit: limit,
        sentToday: stats.sentToday,
        totalSent: stats.totalSent,
        delivered: stats.delivered,
        bounced: stats.bounced,
        opened: stats.opened,
        replied: stats.replied,
        bounceRate,
        replyRate,
        healthStatus: bounceRate > 10 ? "warning" : "healthy",
      };
    });

  // Calculate unique opens & overall metrics
  const uniqueOpens = await prisma.campaignProspect.count({
    where: { campaignId: id, openCount: { gt: 0 } },
  });

  const totalSent = statusCounts.in_progress + statusCounts.completed + statusCounts.replied + statusCounts.bounced + statusCounts.unsubscribed;
  const delivered = Math.max(0, totalSent - statusCounts.bounced - statusCounts.failed);

  const metrics = {
    totalLeads: statusCounts.total,
    sent: totalSent,
    delivered,
    bounced: statusCounts.bounced,
    failed: statusCounts.failed,
    opened: logs.filter((l) => l.status === "opened" || l.openedAt).length,
    uniqueOpens,
    clicked: logs.filter((l) => l.status === "clicked" || l.clickedAt).length,
    replied: statusCounts.replied,
    unsubscribed: statusCounts.unsubscribed,
    pending: statusCounts.pending,
    inProgress: statusCounts.in_progress,
    completed: statusCounts.completed,
    openRate: delivered > 0 ? Math.round((uniqueOpens / delivered) * 100) : 0,
    replyRate: delivered > 0 ? Math.round((statusCounts.replied / delivered) * 100) : 0,
    bounceRate: totalSent > 0 ? Math.round((statusCounts.bounced / totalSent) * 100) : 0,
  };

  return NextResponse.json({
    campaign: {
      ...campaign,
      hooks,
      steps,
      selectedMailboxIds: selectedIds,
      mailboxLimits: customLimitsMap,
      sendingDays: campaign.sendingDaysJson ? JSON.parse(campaign.sendingDaysJson) : ["mon", "tue", "wed", "thu", "fri"],
    },
    metrics,
    hookPerformance,
    stepPerformance,
    mailboxPerformance,
    recentLogs: logs.slice(0, 30),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, ...updates } = body;

    const existing = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const now = new Date();
    const patchData: Record<string, unknown> = {};

    if (action === "launch") {
      patchData.status = "active";
      if (!existing.startedAt) patchData.startedAt = now;
      patchData.stoppedAt = null;
    } else if (action === "pause") {
      patchData.status = "paused";
    } else if (action === "resume") {
      patchData.status = "active";
    } else if (action === "stop") {
      patchData.status = "stopped";
      patchData.stoppedAt = now;
      patchData.stopReason = "manual_stop";
    } else if (action === "schedule") {
      patchData.status = "scheduled";
      if (updates.scheduledStartDate) {
        patchData.scheduledStartDate = new Date(updates.scheduledStartDate);
      }
    }

    // Direct field updates
    if (updates.name) patchData.name = String(updates.name).trim();
    if (updates.hooks) patchData.hooksJson = JSON.stringify(updates.hooks);
    if (updates.steps) patchData.stepsJson = JSON.stringify(updates.steps);
    if (updates.selectedMailboxIds !== undefined) {
      patchData.selectedMailboxIds = typeof updates.selectedMailboxIds === "string" ? updates.selectedMailboxIds : JSON.stringify(updates.selectedMailboxIds);
    }
    if (updates.dailyLimitPerMailbox !== undefined) {
      patchData.dailyLimitPerMailbox = Math.max(1, Number(updates.dailyLimitPerMailbox) || 10);
    }
    if (updates.mailboxLimits !== undefined) {
      patchData.mailboxLimitsJson = JSON.stringify(updates.mailboxLimits);
    }
    if (updates.minDelayMinutes !== undefined) {
      patchData.minDelayMinutes = Math.max(1, Number(updates.minDelayMinutes) || 4);
    }
    if (updates.maxDelayMinutes !== undefined) {
      patchData.maxDelayMinutes = Math.max(1, Number(updates.maxDelayMinutes) || 7);
    }
    if (updates.timezone) patchData.timezone = updates.timezone;
    if (updates.useRecipientTimezone !== undefined) patchData.useRecipientTimezone = Boolean(updates.useRecipientTimezone);
    if (updates.sendingDays) patchData.sendingDaysJson = JSON.stringify(updates.sendingDays);
    if (updates.sendingWindowStart) patchData.sendingWindowStart = updates.sendingWindowStart;
    if (updates.sendingWindowEnd) patchData.sendingWindowEnd = updates.sendingWindowEnd;

    const updated = await prisma.campaign.update({
      where: { id },
      data: patchData,
    });

    if (action === "launch" || action === "resume") {
      void processCampaignSends({ campaignId: id, userId: user.id });
    }

    return NextResponse.json({ ok: true, campaign: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.campaign.delete({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
