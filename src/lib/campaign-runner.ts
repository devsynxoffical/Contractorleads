import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import {
  parseCampaignHooks,
  parseCampaignSteps,
  renderCampaignTemplate,
  DEFAULT_DAY0_HOOKS,
  type CampaignHook,
  type CampaignFollowUpStep,
} from "@/lib/campaign-engine";
import {
  isWithinSendingWindow,
  getLocalTimeInTimezone,
  calculateJitterDelayMs,
} from "@/lib/campaign-timezone";
import { sendOutboundEmail } from "@/lib/user-smtp";
import { appBaseUrl } from "@/lib/email-brand";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Execute one cycle of pending/due campaign sends across active campaigns.
 */
export async function processCampaignSends(opts?: {
  campaignId?: string;
  userId?: string;
  limitPerCampaign?: number;
}) {
  const now = new Date();
  const limitPerCampaign = opts?.limitPerCampaign ?? 30;

  // 1. Activate scheduled campaigns whose start date has arrived
  await prisma.campaign.updateMany({
    where: {
      status: "scheduled",
      scheduledStartDate: { lte: now },
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.campaignId ? { id: opts.campaignId } : {}),
    },
    data: {
      status: "active",
      startedAt: now,
    },
  });

  // 2. Fetch active campaigns
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      status: "active",
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.campaignId ? { id: opts.campaignId } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          ownerName: true,
          companyName: true,
        },
      },
    },
  });

  const results: Array<{
    campaignId: string;
    campaignName: string;
    sent: number;
    skipped: number;
    completed: number;
    errors: string[];
  }> = [];

  for (const campaign of activeCampaigns) {
    const campaignResult = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      sent: 0,
      skipped: 0,
      completed: 0,
      errors: [] as string[],
    };

    const hooks = parseCampaignHooks(campaign.hooksJson);
    const steps = parseCampaignSteps(campaign.stepsJson).filter((s) => s.active);

    const sendingDays = campaign.sendingDaysJson
      ? (JSON.parse(campaign.sendingDaysJson) as string[])
      : ["mon", "tue", "wed", "thu", "fri"];

    const windowStart = campaign.sendingWindowStart || "09:00";
    const windowEnd = campaign.sendingWindowEnd || "17:00";

    // Check if campaign level timezone is currently within window (if not using recipient tz)
    if (!campaign.useRecipientTimezone) {
      const inWindow = isWithinSendingWindow(
        now,
        campaign.timezone || "America/New_York",
        sendingDays,
        windowStart,
        windowEnd
      );
      if (!inWindow) {
        campaignResult.skipped++;
        results.push(campaignResult);
        continue;
      }
    }

    // Discover mailboxes for this campaign
    const [userMailboxes, systemMailboxes, todayLogs] = await Promise.all([
      prisma.smtpAccount.findMany({
        where: {
          userId: campaign.userId,
          enabled: true,
          NOT: {
            fromEmail: {
              contains: "contractorleads.us",
              mode: "insensitive",
            },
          },
        },
      }),
      prisma.systemSmtpAccount.findMany({
        where: { enabled: true },
      }),
      prisma.campaignLog.findMany({
        where: {
          sentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { mailboxId: true, fromEmail: true },
      }),
    ]);

    // Count sends today per mailbox
    const sendsTodayMap = new Map<string, number>();
    for (const log of todayLogs) {
      const key = log.mailboxId || log.fromEmail;
      sendsTodayMap.set(key, (sendsTodayMap.get(key) || 0) + 1);
    }

    // Filter by campaign's selectedMailboxIds
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

    const availableMailboxes = [...userMailboxes, ...systemMailboxes]
      .filter((m) => {
        if (!m.enabled) return false;
        if (Array.isArray(selectedIds) && !selectedIds.includes(m.id) && !selectedIds.includes(m.fromEmail)) {
          return false;
        }
        const limit = customLimitsMap[m.id] ?? campaign.dailyLimitPerMailbox ?? 10;
        const sentToday = sendsTodayMap.get(m.id) || 0;
        return sentToday < limit;
      });

    if (availableMailboxes.length === 0) {
      campaignResult.errors.push("All selected mailboxes have reached their daily sending limit today.");
      results.push(campaignResult);
      continue;
    }

    // Find due prospects
    const dueProspects = await prisma.campaignProspect.findMany({
      where: {
        campaignId: campaign.id,
        status: { in: ["pending", "in_progress"] },
        OR: [{ nextSendDueAt: null }, { nextSendDueAt: { lte: now } }],
      },
      take: limitPerCampaign,
      orderBy: { createdAt: "asc" },
    });

    if (dueProspects.length === 0) {
      // Check if all prospects in campaign are completed / replied
      const remainingCount = await prisma.campaignProspect.count({
        where: {
          campaignId: campaign.id,
          status: { in: ["pending", "in_progress"] },
        },
      });

      if (remainingCount === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "completed", completedAt: now },
        });
        campaignResult.completed = 1;
      }

      results.push(campaignResult);
      continue;
    }

    let mailboxIndex = 0;
    const senderName =
      campaign.user.ownerName ||
      campaign.user.name ||
      campaign.user.companyName ||
      "Our Team";

    for (const prospect of dueProspects) {
      // If using recipient timezone, verify prospect's local time is in window
      if (campaign.useRecipientTimezone) {
        const prospectTz = prospect.timezone || campaign.timezone || "America/New_York";
        const inWindow = isWithinSendingWindow(
          now,
          prospectTz,
          sendingDays,
          windowStart,
          windowEnd
        );
        if (!inWindow) {
          continue;
        }
      }

      // Check current step
      const stepIdx = prospect.currentStepIndex;
      let subject = "";
      let bodyTemplate = "";
      let hookId: string | null = null;

      if (stepIdx === 0) {
        // Day 0 Outreach Hook
        const assignedHook =
          hooks.find((h) => h.id === prospect.assignedHookId && h.active) ||
          hooks.find((h) => h.active) ||
          DEFAULT_DAY0_HOOKS[0];

        subject = assignedHook.subject;
        bodyTemplate = assignedHook.body;
        hookId = assignedHook.id;
      } else {
        // Follow-up Step
        const followUpStep = steps[stepIdx - 1];
        if (!followUpStep) {
          // No more steps -> mark completed
          await prisma.campaignProspect.update({
            where: { id: prospect.id },
            data: { status: "completed" },
          });
          continue;
        }
        subject = followUpStep.subject.replace("{{lastSubject}}", prospect.lastSubject || "Our conversation");
        bodyTemplate = followUpStep.body;
      }

      // Render email content with personalizations
      const renderedSubject = renderCampaignTemplate(
        subject,
        prospect,
        senderName
      );
      const renderedBody = renderCampaignTemplate(
        bodyTemplate,
        prospect,
        senderName,
        {
          lastSubject: prospect.lastSubject || "",
        }
      );

      // Select mailbox
      const mailbox = availableMailboxes[mailboxIndex % availableMailboxes.length];
      mailboxIndex++;

      const trackingToken = randomBytes(24).toString("hex");

      try {
        const sentResult = await sendOutboundEmail({
          userId: campaign.userId,
          to: prospect.email,
          subject: renderedSubject,
          text: renderedBody,
          accountId: mailbox.id,
        });

        // Log campaign email
        await prisma.campaignLog.create({
          data: {
            campaignId: campaign.id,
            prospectId: prospect.id,
            stepIndex: stepIdx,
            hookId,
            mailboxId: mailbox.id,
            fromEmail: sentResult.fromEmail || mailbox.fromEmail,
            toEmail: prospect.email,
            subject: renderedSubject,
            body: renderedBody,
            status: "sent",
            messageId: sentResult.messageId ?? null,
            trackingToken,
          },
        });

        // Calculate next step due date
        const nextStepIdx = stepIdx + 1;
        let nextDue: Date | null = null;
        let nextStatus = "in_progress";

        if (nextStepIdx <= steps.length) {
          const nextFollowUp = steps[nextStepIdx - 1];
          const delayDays = nextFollowUp ? Math.max(1, nextFollowUp.dayDelay) : 2;
          nextDue = new Date(Date.now() + delayDays * DAY_MS);
        } else {
          nextStatus = "completed";
        }

        // Update prospect state
        await prisma.campaignProspect.update({
          where: { id: prospect.id },
          data: {
            status: nextStatus,
            currentStepIndex: nextStepIdx,
            lastSentAt: now,
            nextSendDueAt: nextDue,
            lastMailboxId: mailbox.id,
            lastFromEmail: sentResult.fromEmail || mailbox.fromEmail,
            lastSubject: renderedSubject,
          },
        });

        // Update send count for mailbox
        sendsTodayMap.set(mailbox.id, (sendsTodayMap.get(mailbox.id) || 0) + 1);
        campaignResult.sent++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Send failure";
        campaignResult.errors.push(`Prospect ${prospect.email}: ${errMsg}`);

        await prisma.campaignLog.create({
          data: {
            campaignId: campaign.id,
            prospectId: prospect.id,
            stepIndex: stepIdx,
            hookId,
            mailboxId: mailbox.id,
            fromEmail: mailbox.fromEmail,
            toEmail: prospect.email,
            subject: renderedSubject,
            body: renderedBody,
            status: "failed",
            error: errMsg,
          },
        });

        // If email bounced or hard error, stop follow-ups for this prospect
        const isHardBounce = errMsg.toLowerCase().includes("invalid") || errMsg.toLowerCase().includes("not exist") || errMsg.toLowerCase().includes("550");
        if (isHardBounce) {
          await prisma.campaignProspect.update({
            where: { id: prospect.id },
            data: {
              status: "bounced",
              stopReason: "bounced",
              bouncedAt: now,
              nextSendDueAt: null,
            },
          });
        }
      }
    }

    results.push(campaignResult);
  }

  return results;
}

/**
 * Stop sequence for a prospect immediately when they reply or unsubscribe.
 */
export async function triggerFollowUpStopLogic(
  email: string,
  reason: "replied" | "unsubscribed" | "bounced" | "manual_stop",
  meta?: { campaignId?: string }
) {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  const prospects = await prisma.campaignProspect.findMany({
    where: {
      email: normalizedEmail,
      status: { in: ["pending", "in_progress"] },
      ...(meta?.campaignId ? { campaignId: meta.campaignId } : {}),
    },
  });

  if (prospects.length === 0) return { updated: 0 };

  const updateData: Record<string, unknown> = {
    status: reason,
    stopReason: reason,
    nextSendDueAt: null,
  };

  if (reason === "replied") updateData.repliedAt = now;
  if (reason === "unsubscribed") updateData.unsubscribedAt = now;
  if (reason === "bounced") updateData.bouncedAt = now;

  await prisma.campaignProspect.updateMany({
    where: {
      id: { in: prospects.map((p) => p.id) },
    },
    data: updateData,
  });

  return { updated: prospects.length, reason };
}
