import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { backfillThreads } from "./threads";
import { UNIBOX_LABELS, isUniboxLabelId } from "./labels";

/** Unibox reads. Every query is scoped to one workspace (userId). */

export type ThreadFilters = {
  campaignId?: string | null; // "none" = replies not linked to a campaign
  labels?: string[];
  mailbox?: string | null;
  q?: string | null;
  unread?: boolean;
  status?: "open" | "archived" | "all";
  followUpDue?: boolean;
  page?: number;
  limit?: number;
};

export function threadWhere(userId: string, f: ThreadFilters): Prisma.InboxThreadWhereInput {
  const labels = (f.labels ?? []).filter(isUniboxLabelId);
  const q = f.q?.trim();
  return {
    userId,
    ...(f.campaignId === "none" ? { campaignId: null } : f.campaignId ? { campaignId: f.campaignId } : {}),
    // Multiple labels = OR (spec section 9)
    ...(labels.length ? { label: { in: labels } } : {}),
    ...(f.mailbox ? { mailboxEmail: f.mailbox.toLowerCase() } : {}),
    ...(f.unread ? { unread: true } : {}),
    ...(f.status === "all" ? {} : { status: f.status ?? "open" }),
    ...(f.followUpDue ? { followUpAt: { lte: new Date() } } : {}),
    ...(q
      ? {
          OR: [
            { contactEmail: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
            { subject: { contains: q, mode: "insensitive" } },
            { preview: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/** Thread replies that arrived before the Unibox existed (bounded per call). */
export async function ensureBackfill(userId: string) {
  const pending = await prisma.leadEmail.count({ where: { userId, direction: "inbound", threadId: null } });
  if (pending > 0) await backfillThreads(userId, 300);
}

export async function listThreads(userId: string, f: ThreadFilters) {
  await ensureBackfill(userId);
  const limit = Math.min(100, Math.max(1, f.limit ?? 50));
  const page = Math.max(1, f.page ?? 1);
  const where = threadWhere(userId, f);
  const [rows, total] = await Promise.all([
    prisma.inboxThread.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { campaign: { select: { id: true, name: true, status: true } } },
    }),
    prisma.inboxThread.count({ where }),
  ]);
  return {
    threads: rows.map((t) => ({
      id: t.id,
      leadId: t.leadId,
      campaign: t.campaign ? { id: t.campaign.id, name: t.campaign.name, status: t.campaign.status } : null,
      campaignMatch: t.campaignMatch,
      contactEmail: t.contactEmail,
      contactName: t.contactName,
      mailboxEmail: t.mailboxEmail,
      subject: t.subject,
      preview: t.preview,
      label: t.label,
      labelSource: t.labelSource,
      followUpAt: t.followUpAt?.toISOString() ?? null,
      unread: t.unread,
      status: t.status,
      messageCount: t.messageCount,
      lastMessageAt: t.lastMessageAt.toISOString(),
    })),
    total,
    page,
    limit,
  };
}

/** Campaign, label and mailbox options with counts for the filter sidebar. */
export async function filterOptions(userId: string, f: Pick<ThreadFilters, "campaignId" | "status">) {
  await ensureBackfill(userId);
  const status = f.status === "all" ? {} : { status: f.status ?? "open" };
  const scopeCampaign = f.campaignId === "none" ? { campaignId: null } : f.campaignId ? { campaignId: f.campaignId } : {};
  const [byCampaign, byLabel, byMailbox, unread, campaigns] = await Promise.all([
    prisma.inboxThread.groupBy({ by: ["campaignId"], where: { userId, ...status }, _count: { _all: true } }),
    prisma.inboxThread.groupBy({ by: ["label"], where: { userId, ...status, ...scopeCampaign }, _count: { _all: true } }),
    prisma.inboxThread.groupBy({ by: ["mailboxEmail"], where: { userId, ...status, ...scopeCampaign }, _count: { _all: true } }),
    prisma.inboxThread.groupBy({ by: ["campaignId"], where: { userId, ...status, unread: true }, _count: { _all: true } }),
    prisma.campaign.findMany({ where: { userId }, select: { id: true, name: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const count = new Map(byCampaign.map((r) => [r.campaignId ?? "none", r._count._all]));
  const unreadBy = new Map(unread.map((r) => [r.campaignId ?? "none", r._count._all]));
  const labelCount = new Map(byLabel.map((r) => [r.label, r._count._all]));
  return {
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      threads: count.get(c.id) ?? 0,
      unread: unreadBy.get(c.id) ?? 0,
    })),
    noCampaign: { threads: count.get("none") ?? 0, unread: unreadBy.get("none") ?? 0 },
    totalThreads: [...count.values()].reduce((a, b) => a + b, 0),
    totalUnread: [...unreadBy.values()].reduce((a, b) => a + b, 0),
    labels: [...UNIBOX_LABELS]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => ({ id: l.id, name: l.name, color: l.color, auto: l.auto, count: labelCount.get(l.id) ?? 0 })),
    mailboxes: byMailbox
      .map((m) => ({ email: m.mailboxEmail, threads: m._count._all }))
      .sort((a, b) => b.threads - a.threads),
  };
}

export type ThreadMessage = {
  id: string;
  direction: "inbound" | "outbound";
  source: "email" | "campaign";
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  at: string;
  status: string;
  step?: string | null;
};

/** Full conversation: inbound and outbound emails in the thread plus the campaign emails sent to the lead. */
export async function getThread(userId: string, threadId: string, opts: { markRead?: boolean } = {}) {
  const t = await prisma.inboxThread.findFirst({
    where: { id: threadId, userId },
    include: {
      campaign: { select: { id: true, name: true, status: true, startedAt: true } },
      labelHistory: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!t) return null;
  const [emails, sends, prospect] = await Promise.all([
    prisma.leadEmail.findMany({
      where: { userId, threadId: t.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, direction: true, fromEmail: true, toEmail: true, subject: true, body: true, createdAt: true, status: true },
    }),
    t.prospectId
      ? prisma.campaignLog.findMany({
          where: { prospectId: t.prospectId, campaign: { userId }, status: { in: ["sent", "opened", "clicked", "replied", "delivered"] } },
          orderBy: { sentAt: "asc" },
          select: { id: true, fromEmail: true, toEmail: true, subject: true, body: true, sentAt: true, status: true, stepIndex: true, variantLabel: true },
        })
      : Promise.resolve([]),
    t.prospectId
      ? prisma.campaignProspect.findFirst({
          where: { id: t.prospectId, campaign: { userId } },
          select: { id: true, status: true, stopReason: true, businessName: true, ownerName: true, phone: true, city: true, state: true, currentStepIndex: true },
        })
      : Promise.resolve(null),
  ]);

  const messages: ThreadMessage[] = [
    ...emails.map((e) => ({
      id: e.id,
      direction: (e.direction === "inbound" ? "inbound" : "outbound") as ThreadMessage["direction"],
      source: "email" as const,
      fromEmail: e.fromEmail,
      toEmail: e.toEmail,
      subject: e.subject,
      body: e.body,
      at: e.createdAt.toISOString(),
      status: e.status,
    })),
    ...sends.map((s) => ({
      id: `log_${s.id}`,
      direction: "outbound" as const,
      source: "campaign" as const,
      fromEmail: s.fromEmail,
      toEmail: s.toEmail,
      subject: s.subject,
      body: s.body,
      at: (s.sentAt ?? new Date(0)).toISOString(),
      status: s.status,
      step: s.stepIndex === 0 ? "Day 0" : `Follow-up ${s.stepIndex}`,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  if (opts.markRead && t.unread) {
    await Promise.all([
      prisma.inboxThread.update({ where: { id: t.id }, data: { unread: false } }),
      prisma.leadEmail.updateMany({ where: { userId, threadId: t.id, direction: "inbound", readAt: null }, data: { readAt: new Date() } }),
    ]);
  }

  return {
    thread: {
      id: t.id,
      leadId: t.leadId,
      contactEmail: t.contactEmail,
      contactName: t.contactName,
      mailboxEmail: t.mailboxEmail,
      subject: t.subject,
      label: t.label,
      labelSource: t.labelSource,
      labelReason: t.labelReason,
      followUpAt: t.followUpAt?.toISOString() ?? null,
      referredEmail: t.referredEmail,
      referredName: t.referredName,
      unread: opts.markRead ? false : t.unread,
      status: t.status,
      campaignMatch: t.campaignMatch,
      lastMessageAt: t.lastMessageAt.toISOString(),
    },
    campaign: t.campaign
      ? { id: t.campaign.id, name: t.campaign.name, status: t.campaign.status, startedAt: t.campaign.startedAt?.toISOString() ?? null }
      : null,
    prospect,
    messages,
    history: t.labelHistory.map((h) => ({
      id: h.id,
      oldLabel: h.oldLabel,
      newLabel: h.newLabel,
      changeType: h.changeType,
      changedBy: h.changedBy,
      reason: h.reason,
      at: h.createdAt.toISOString(),
    })),
  };
}
