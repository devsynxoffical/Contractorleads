import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import {
  isWithinSendingWindow,
  resolveRecipientTimezone,
  calculateJitterDelayMs,
} from "@/lib/campaign-timezone";
import {
  HOSTINGER_DEFAULT_MAILBOXES,
  seedHostingerMailboxes,
  type SystemSmtpRow,
} from "@/lib/system-smtp";
import { sendOutboundEmail } from "@/lib/user-smtp";
import { appBaseUrl } from "@/lib/email-brand";

export * from "@/lib/campaign-types";
import {
  type CampaignHook,
  DEFAULT_DAY0_HOOKS,
} from "@/lib/campaign-types";

/**
 * Deduplicate raw leads by email and prepare campaign prospect payloads.
 */
export function prepareCampaignProspects(
  rawLeads: Array<{
    id?: string;
    businessName: string;
    ownerName?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  }>,
  activeHooks: CampaignHook[]
) {
  const seenEmails = new Set<string>();
  const validProspects: Array<{
    leadId?: string;
    businessName: string;
    ownerName?: string | null;
    email: string;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    country: string;
    timezone: string;
    assignedHookId: string;
  }> = [];

  let duplicateCount = 0;
  const usableHooks = activeHooks.filter((h) => h.active);
  const hookList = usableHooks.length > 0 ? usableHooks : DEFAULT_DAY0_HOOKS;

  let hookIndex = 0;

  for (const lead of rawLeads) {
    const email = lead.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      continue;
    }

    if (seenEmails.has(email)) {
      duplicateCount++;
      continue;
    }

    seenEmails.add(email);
    const assignedHook = hookList[hookIndex % hookList.length];
    hookIndex++;

    const timezone = resolveRecipientTimezone({
      state: lead.state,
      city: lead.city,
      country: lead.country,
    });

    validProspects.push({
      leadId: lead.id,
      businessName: lead.businessName,
      ownerName: lead.ownerName,
      email,
      phone: lead.phone,
      city: lead.city,
      state: lead.state,
      country: lead.country || "US",
      timezone,
      assignedHookId: assignedHook.id,
    });
  }

  return {
    prospects: validProspects,
    totalRawCount: rawLeads.length,
    uniqueEmailCount: validProspects.length,
    duplicateCount,
  };
}

import { isGlobalSuperAdmin } from "@/lib/roles";

/** Get list of eligible mailboxes and calculate daily send capacity */
export async function getCampaignMailboxStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  const isSuper = isGlobalSuperAdmin(user);

  // Super Admins & Owners see all system mailboxes.
  // Regular users ONLY see system mailboxes explicitly assigned to their user ID.
  const systemWhere: any = isSuper
    ? { enabled: true }
    : { enabled: true, assignedUserId: userId };

  let systemAccounts = await prisma.systemSmtpAccount.findMany({
    where: systemWhere,
    orderBy: [{ provider: "asc" }, { domain: "asc" }, { createdAt: "asc" }],
  });

  if (systemAccounts.length === 0 && isSuper) {
    await seedHostingerMailboxes(false);
    systemAccounts = await prisma.systemSmtpAccount.findMany({
      where: { enabled: true },
      orderBy: [{ provider: "asc" }, { domain: "asc" }, { createdAt: "asc" }],
    });
  }

  const [userAccounts, todayLogs] = await Promise.all([
    prisma.smtpAccount.findMany({
      where: { userId, enabled: true },
    }),
    prisma.campaignLog.findMany({
      where: {
        sentAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      select: {
        mailboxId: true,
        fromEmail: true,
        status: true,
      },
    }),
  ]);

  // Aggregate today's sends per mailbox
  const sendsTodayMap = new Map<string, { sent: number; bounced: number; opened: number; replied: number }>();

  for (const log of todayLogs) {
    const key = log.mailboxId || log.fromEmail;
    const current = sendsTodayMap.get(key) || { sent: 0, bounced: 0, opened: 0, replied: 0 };
    current.sent++;
    if (log.status === "bounced" || log.status === "failed") current.bounced++;
    if (log.status === "opened") current.opened++;
    if (log.status === "replied") current.replied++;
    sendsTodayMap.set(key, current);
  }

  const eligibleUserAccounts = userAccounts.filter((a) => {
    const domain = (a.fromEmail.split("@")[1] || "").toLowerCase().trim();
    return domain !== "contractorleads.us" && !domain.endsWith(".contractorleads.us");
  });

  const allMailboxes = [
    ...eligibleUserAccounts.map((a) => ({
      id: a.id,
      label: a.label || a.fromEmail,
      email: a.fromEmail,
      domain: a.fromEmail.split("@")[1] || "custom",
      type: "user" as const,
      enabled: a.enabled,
      isDefault: a.isDefault,
      sendWeight: a.sendWeight,
      sendsToday: sendsTodayMap.get(a.id)?.sent || 0,
      bouncedToday: sendsTodayMap.get(a.id)?.bounced || 0,
    })),
    ...systemAccounts.map((s) => ({
      id: s.id,
      label: s.fromName ? `${s.fromName} (${s.fromEmail})` : s.fromEmail,
      email: s.fromEmail,
      domain: s.domain || s.fromEmail.split("@")[1] || "hostinger",
      type: "system" as const,
      enabled: s.enabled,
      isDefault: s.isDefault,
      sendWeight: s.sendWeight,
      sendsToday: sendsTodayMap.get(s.id)?.sent || 0,
      bouncedToday: sendsTodayMap.get(s.id)?.bounced || 0,
    })),
  ];

  return {
    mailboxes: allMailboxes,
    totalMailboxes: allMailboxes.length,
    activeMailboxes: allMailboxes.filter((m) => m.enabled).length,
  };
}
