import { prisma } from "@/lib/prisma";
import { classifyReply, stripQuoted, type ClassifyResult } from "./classifier";
import { getUniboxLabel, type UniboxLabelId } from "./labels";

/**
 * Unibox threading: attach each inbound reply to one conversation per
 * (workspace, contact, receiving mailbox, campaign), match it to the campaign that
 * contacted the lead, and auto-label it.
 *
 * Campaign matching, strongest first:
 *   1. In-Reply-To = Message-ID of a campaign email we sent (CampaignLog.messageId)
 *   2. References contains such a Message-ID
 *   3. The reply chains to a message already in a thread (same thread, rule 6)
 *   4. The sender is a prospect in one of this workspace's campaigns
 * Every lookup is scoped to the workspace (userId), so one workspace never sees or
 * changes another's threads (rule 7).
 */

export type InboundForThread = {
  id: string;
  userId: string;
  leadId: string | null;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  headersJson: string | null;
  createdAt: Date;
};

/** "<Abc@x>" -> ["<Abc@x>", "Abc@x"]: stored ids may or may not keep angle brackets. */
export function messageIdVariants(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const bare = part.trim().replace(/^<|>$/g, "");
    if (!bare || !bare.includes("@")) continue;
    out.add(bare);
    out.add(`<${bare}>`);
  }
  return [...out];
}

export function parseHeaders(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const v = JSON.parse(json) as unknown;
    return v && typeof v === "object" ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}

type CampaignMatch = {
  campaignId: string | null;
  prospectId: string | null;
  match: "in_reply_to" | "references" | "prospect_email" | "none";
  /** Recipient of the campaign email (used for bounces from mailer-daemon) */
  originalRecipient?: string | null;
};

export async function matchCampaign(
  userId: string,
  msg: Pick<InboundForThread, "inReplyTo" | "references" | "fromEmail" | "toEmail">,
): Promise<CampaignMatch> {
  const irt = messageIdVariants(msg.inReplyTo);
  const refs = messageIdVariants(msg.references).filter((r) => !irt.includes(r));
  for (const [ids, match] of [
    [irt, "in_reply_to"],
    [refs, "references"],
  ] as const) {
    if (!ids.length) continue;
    const log = await prisma.campaignLog.findFirst({
      where: { messageId: { in: ids }, campaign: { userId } },
      orderBy: { sentAt: "desc" },
      select: { campaignId: true, prospectId: true, toEmail: true },
    });
    if (log) return { campaignId: log.campaignId, prospectId: log.prospectId, match, originalRecipient: log.toEmail };
  }
  const prospect = await prisma.campaignProspect.findFirst({
    where: { email: { equals: msg.fromEmail, mode: "insensitive" }, campaign: { userId } },
    orderBy: [{ lastSentAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { id: true, campaignId: true, lastFromEmail: true },
  });
  if (prospect) return { campaignId: prospect.campaignId, prospectId: prospect.id, match: "prospect_email" };
  return { campaignId: null, prospectId: null, match: "none" };
}

/** An earlier message in the workspace this one replies to, if it already has a thread. */
async function chainedThreadId(userId: string, msg: Pick<InboundForThread, "inReplyTo" | "references">) {
  const ids = [...messageIdVariants(msg.inReplyTo), ...messageIdVariants(msg.references)];
  if (!ids.length) return null;
  const prior = await prisma.leadEmail.findFirst({
    where: { userId, messageId: { in: ids }, threadId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { threadId: true },
  });
  return prior?.threadId ?? null;
}

/** Auto label to store, given the thread's current label. Manual labels are never overridden. */
export function nextAutoLabel(
  current: { label: string; labelSource: string } | null,
  result: ClassifyResult,
): UniboxLabelId | null {
  if (current?.labelSource === "manual") return null;
  if (result.label !== "unlabelled") return result.label;
  // A human reply after a system message (OOO / auto-reply) needs review again.
  if (current && (current.label === "out_of_office" || current.label === "automatic_reply")) return "unlabelled";
  return current ? null : "unlabelled";
}

export type AttachResult = {
  threadId: string;
  label: string;
  classification: ClassifyResult;
  campaignId: string | null;
  contactEmail: string;
};

/**
 * Attach an inbound LeadEmail to its thread, label it and return what happened.
 * Idempotent: a message that already has a thread is returned as-is.
 */
export async function attachInboundMessage(emailId: string, opts: { backfill?: boolean } = {}): Promise<AttachResult | null> {
  const msg = await prisma.leadEmail.findUnique({
    where: { id: emailId },
    select: {
      id: true,
      userId: true,
      leadId: true,
      direction: true,
      fromEmail: true,
      toEmail: true,
      subject: true,
      body: true,
      messageId: true,
      inReplyTo: true,
      references: true,
      headersJson: true,
      createdAt: true,
      threadId: true,
      lead: { select: { businessName: true, ownerName: true } },
    },
  });
  if (!msg || msg.direction !== "inbound") return null;

  const headers = parseHeaders(msg.headersJson);
  const classification = classifyReply({
    subject: msg.subject,
    body: msg.body,
    headers,
    fromEmail: msg.fromEmail,
    mailboxEmail: msg.toEmail,
    receivedAt: msg.createdAt,
  });

  if (msg.threadId) {
    const t = await prisma.inboxThread.findUnique({ where: { id: msg.threadId }, select: { label: true, campaignId: true, contactEmail: true } });
    return {
      threadId: msg.threadId,
      label: t?.label ?? "unlabelled",
      classification,
      campaignId: t?.campaignId ?? null,
      contactEmail: t?.contactEmail ?? msg.fromEmail,
    };
  }

  let campaign = await matchCampaign(msg.userId, msg);
  // Bounces come from mailer-daemon: the conversation belongs to the original recipient.
  const bounceRecipient = classification.bounce
    ? (campaign.originalRecipient ?? bouncedRecipientFromBody(msg.body))
    : null;
  if (bounceRecipient && !campaign.campaignId) {
    campaign = await matchCampaign(msg.userId, { ...msg, fromEmail: bounceRecipient });
  }
  const contactEmail = (bounceRecipient ?? msg.fromEmail).toLowerCase();
  const mailboxEmail = msg.toEmail.toLowerCase();

  const chained = await chainedThreadId(msg.userId, msg);
  const threadKey = `${contactEmail}|${mailboxEmail}|${campaign.campaignId ?? "none"}`;
  const ownText = stripQuoted(msg.body).replace(/\s+/g, " ").trim();
  const preview = (ownText || msg.body.replace(/\s+/g, " ").trim()).slice(0, 160);
  const contactName = msg.lead?.ownerName || msg.lead?.businessName || null;

  const existing = chained
    ? await prisma.inboxThread.findUnique({ where: { id: chained } })
    : await prisma.inboxThread.findUnique({ where: { userId_threadKey: { userId: msg.userId, threadKey } } });

  const newLabel = nextAutoLabel(existing, classification);
  const labelData = newLabel
    ? {
        label: newLabel,
        labelSource: "auto",
        labelReason: classification.reason,
        labelChangedAt: new Date(),
        ...(classification.followUpAt !== undefined ? { followUpAt: classification.followUpAt } : {}),
        ...(classification.referred
          ? { referredEmail: classification.referred.email ?? null, referredName: classification.referred.name ?? null }
          : {}),
      }
    : {};

  const isNewer = !existing || msg.createdAt >= existing.lastMessageAt;
  const thread = existing
    ? await prisma.inboxThread.update({
        where: { id: existing.id },
        data: {
          ...labelData,
          ...(isNewer ? { preview, lastMessageAt: msg.createdAt, lastInboundAt: msg.createdAt } : {}),
          ...(opts.backfill ? {} : { unread: true }),
          messageCount: { increment: 1 },
          leadId: existing.leadId ?? msg.leadId,
          contactName: existing.contactName ?? contactName,
          ...(existing.campaignId ? {} : campaign.campaignId ? { campaignId: campaign.campaignId, prospectId: campaign.prospectId, campaignMatch: campaign.match } : {}),
        },
      })
    : await prisma.inboxThread.create({
        data: {
          userId: msg.userId,
          threadKey,
          leadId: msg.leadId,
          campaignId: campaign.campaignId,
          prospectId: campaign.prospectId,
          campaignMatch: campaign.match,
          contactEmail,
          contactName,
          mailboxEmail,
          subject: msg.subject.replace(/^\s*((re|fwd?|aw|sv)\s*:\s*)+/i, "") || "(no subject)",
          preview,
          label: newLabel ?? "unlabelled",
          labelSource: "auto",
          labelReason: classification.reason,
          labelChangedAt: new Date(),
          followUpAt: classification.followUpAt ?? null,
          referredEmail: classification.referred?.email ?? null,
          referredName: classification.referred?.name ?? null,
          unread: !opts.backfill,
          messageCount: 1,
          lastMessageAt: msg.createdAt,
          lastInboundAt: msg.createdAt,
        },
      });

  await prisma.leadEmail.update({ where: { id: msg.id }, data: { threadId: thread.id } });

  const oldLabel = existing?.label ?? null;
  if (newLabel && newLabel !== oldLabel) {
    await prisma.inboxLabelHistory.create({
      data: {
        threadId: thread.id,
        userId: msg.userId,
        oldLabel,
        newLabel,
        changedBy: null,
        changeType: "auto",
        reason: `${opts.backfill ? "Backfill: " : ""}${classification.reason}`,
      },
    });
  }

  return { threadId: thread.id, label: thread.label, classification, campaignId: thread.campaignId, contactEmail };
}

/** Manual label change from the Unibox (rule 2: one label per thread, every change logged). */
export async function setThreadLabel(userId: string, threadId: string, label: UniboxLabelId) {
  const thread = await prisma.inboxThread.findFirst({ where: { id: threadId, userId } });
  if (!thread) return null;
  if (thread.label === label && thread.labelSource === "manual") return thread;
  const updated = await prisma.inboxThread.update({
    where: { id: thread.id },
    data: { label, labelSource: "manual", labelReason: `Set by a team member`, labelChangedAt: new Date() },
  });
  await prisma.inboxLabelHistory.create({
    data: {
      threadId: thread.id,
      userId,
      oldLabel: thread.label,
      newLabel: label,
      changedBy: userId,
      changeType: "manual",
      reason: getUniboxLabel(label).name,
    },
  });
  return updated;
}

/**
 * Give replies that arrived before the Unibox existed a thread and a label.
 * Historical: no sequence changes, threads start as read.
 */
export async function backfillThreads(userId: string, max = 300): Promise<number> {
  const pending = await prisma.leadEmail.findMany({
    where: { userId, direction: "inbound", threadId: null },
    orderBy: { createdAt: "asc" },
    take: max,
    select: { id: true },
  });
  for (const p of pending) {
    await attachInboundMessage(p.id, { backfill: true }).catch(() => null);
  }
  return pending.length;
}

/** Find who a bounce was about: Final-Recipient / Original-Recipient, or the campaign email it answers. */
export function bouncedRecipientFromBody(body: string): string | null {
  const m =
    /(?:final|original)-recipient:\s*rfc822;\s*<?([^\s<>;]+@[^\s<>;]+)>?/i.exec(body) ||
    /(?:delivery to the following recipient(?:s)? failed[^\n]*\n\s*)<?([^\s<>]+@[^\s<>]+)>?/i.exec(body) ||
    /(?:wasn't delivered to|could not be delivered to|address couldn't be found)[^\n@]*?<?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>?/i.exec(body);
  return m ? m[1].toLowerCase() : null;
}
