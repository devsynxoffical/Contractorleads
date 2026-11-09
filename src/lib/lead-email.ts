import { renderSpintax } from "@/lib/spintax-engine";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";
import {
  sendOutboundEmail,
  formatSmtpError,
  getUserSenderConfig,
  pickRotationSender,
} from "@/lib/user-smtp";
import { findOwnedLead } from "@/lib/lead-ownership";
import { getAgencyReportBranding } from "@/lib/agency-branding";
import { LEAD_REPORT_SCRIPT_TYPE } from "@/lib/services/lead-intelligence-report";
import {
  buildLeadReportPdf,
  reportPdfFilename,
} from "@/lib/services/lead-report-pdf";

/**
 * Send a one-off email to a lead from the agency SMTP mailbox.
 * Auto-saves lead if needed, logs LeadEmail, moves pipeline to contacted.
 */
export async function sendLeadEmail(opts: {
  userId: string;
  leadId: string;
  subject: string;
  body: string;
  smtpAccountId?: string | null;
  /** When replying to an inbound message */
  inReplyToMessageId?: string | null;
  references?: string | null;
  /** Attach a saved lead intelligence report as PDF */
  attachReportId?: string | null;
  /** Append open-tracking pixel (default true). Replies pass false. */
  track?: boolean;
}) {
  const subject = opts.subject.trim();
  const body = opts.body.trim();
  if (!subject || !body) {
    throw new Error("Subject and body are required");
  }

  const lead = await findOwnedLead(opts.userId, opts.leadId);
  if (!lead) throw new Error("Lead not found");
  const to = lead.email?.trim();
  if (!to) throw new Error("This lead has no email address");

  let saved = await prisma.savedLead.findUnique({
    where: {
      userId_leadId: { userId: opts.userId, leadId: opts.leadId },
    },
  });
  if (!saved) {
    saved = await prisma.savedLead.create({
      data: { userId: opts.userId, leadId: opts.leadId, status: "new" },
    });
  }

  const attachments: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }> = [];

  if (opts.attachReportId) {
    const script = await prisma.script.findFirst({
      where: {
        id: opts.attachReportId,
        userId: opts.userId,
        relatedLeadId: opts.leadId,
        type: { startsWith: LEAD_REPORT_SCRIPT_TYPE },
      },
    });
    if (!script) {
      throw new Error("Report not found to attach");
    }
    const branding = await getAgencyReportBranding(opts.userId);
    const pdf = await buildLeadReportPdf({
      title: script.title || `Intelligence report — ${lead.businessName}`,
      businessName: lead.businessName,
      content: script.content,
      generatedAt: script.createdAt,
      agencyName: branding?.companyName || branding?.name || null,
      branding,
    });
    attachments.push({
      filename: reportPdfFilename(lead.businessName, script.title),
      content: pdf,
      contentType: "application/pdf",
    });
  }

  // Resolve the intended sender up front so a failed row still records the right fromEmail.
  let intendedFromEmail = "";
  try {
    const intended = opts.smtpAccountId
      ? await getUserSenderConfig(opts.userId, opts.smtpAccountId)
      : await pickRotationSender(opts.userId);
    intendedFromEmail = intended?.fromEmail || "";
  } catch {
    intendedFromEmail = "";
  }

  try {
    const sent = await sendOutboundEmail({
      userId: opts.userId,
      to,
      subject,
      text: body,
      accountId: opts.smtpAccountId,
      inReplyTo: opts.inReplyToMessageId || undefined,
      references: opts.references || opts.inReplyToMessageId || undefined,
      attachments: attachments.length ? attachments : undefined,
      track: opts.track,
    });

    const emailRow = await prisma.leadEmail.create({
      data: {
        userId: opts.userId,
        leadId: opts.leadId,
        savedLeadId: saved.id,
        smtpAccountId: sent.smtpAccountId ?? null,
        systemSmtpAccountId: sent.systemSmtpAccountId ?? null,
        direction: "outbound",
        fromEmail: sent.fromEmail,
        toEmail: to,
        subject,
        body: attachments.length
          ? `${body}\n\n[Attached: ${attachments.map((a) => a.filename).join(", ")}]`
          : body,
        status: "sent",
        messageId: sent.messageId,
        trackingToken: sent.trackingToken ?? null,
        inReplyTo: opts.inReplyToMessageId || null,
      },
    });

    if (saved.status === "new") {
      await prisma.savedLead.update({
        where: { id: saved.id },
        data: { status: "contacted" },
      });
      void dispatchCrmWebhook(
        opts.userId,
        "lead.status_changed",
        {
          id: lead.id,
          businessName: lead.businessName,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          address: lead.address,
          industry: lead.industry,
          qualityTier: lead.qualityTier,
          leadScore: lead.leadScore,
          status: "contacted",
        },
        { from: "new", to: "contacted", reason: "email_sent" },
      );
    }

    await logActivity(
      opts.userId,
      "email_sent",
      `Emailed ${lead.businessName} <${to}>${
        attachments.length ? " with report PDF" : ""
      }`,
      { leadId: lead.id, emailId: emailRow.id, subject },
    );

    return {
      email: emailRow,
      savedLeadId: saved.id,
      status: saved.status === "new" ? "contacted" : saved.status,
      attachedReport: Boolean(attachments.length),
    };
  } catch (e) {
    const msg = formatSmtpError(e);
    const isSystemSmtp = opts.smtpAccountId
      ? (await prisma.systemSmtpAccount.count({ where: { id: opts.smtpAccountId } })) > 0
      : false;
    await prisma.leadEmail.create({
      data: {
        userId: opts.userId,
        leadId: opts.leadId,
        savedLeadId: saved.id,
        smtpAccountId: isSystemSmtp ? null : (opts.smtpAccountId || null),
        systemSmtpAccountId: isSystemSmtp ? (opts.smtpAccountId || null) : null,
        direction: "outbound",
        fromEmail: intendedFromEmail,
        toEmail: to,
        subject,
        body,
        status: "failed",
        error: msg,
        inReplyTo: opts.inReplyToMessageId || null,
      },
    });
    throw new Error(msg);
  }
}

/** Template variables available in bulk email subject/body ({{businessName}} etc.). */
export function leadTemplateVars(
  lead: {
    businessName: string;
    ownerName?: string | null;
    city?: string | null;
    state?: string | null;
    industry?: string | null;
    website?: string | null;
    phone?: string | null;
  },
  sender: { ownerName?: string | null; companyName?: string | null; name?: string | null },
): Record<string, string> {
  const firstName = (lead.ownerName || "").trim().split(/\s+/)[0] || "there";
  return {
    businessName: lead.businessName || "there",
    ownerName: lead.ownerName || "",
    firstName,
    city: lead.city || "",
    state: lead.state || "",
    industry: lead.industry || "",
    website: lead.website || "",
    phone: lead.phone || "",
    myName: sender.ownerName || sender.name || "",
    myCompany: sender.companyName || "",
  };
}

/** Spintax + variables, seeded per lead so each lead gets its own stable variation. */
function renderTemplate(template: string, vars: Record<string, string>) {
  return renderSpintax(template, vars, { seed: `bulk:${JSON.stringify(vars)}:${template}` }).text;
}

export type BulkEmailResult = {
  leadId: string;
  businessName: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

/**
 * Send a personalized one-off email to many leads at once.
 * Skips leads without an email address. Renders {{variables}} per lead.
 * Sequential + throttled to stay within SMTP rate limits.
 */
export async function sendBulkLeadEmail(opts: {
  userId: string;
  leadIds: string[];
  subject: string;
  body: string;
  smtpAccountId?: string | null;
  /** ms delay between sends (default from rotation settings or 400ms) */
  throttleMs?: number;
  delaySeconds?: number;
  rotationStrategy?: "even-distribution" | "round-robin" | "weighted";
  emailsPerDomain?: number;
}): Promise<{ sent: number; skipped: number; failed: number; results: BulkEmailResult[] }> {
  const subjectTpl = opts.subject.trim();
  const bodyTpl = opts.body.trim();
  if (!subjectTpl || !bodyTpl) throw new Error("Subject and body are required");

  const leadIds = [...new Set(opts.leadIds.filter(Boolean))];
  if (!leadIds.length) throw new Error("Select at least one lead");
  if (leadIds.length > 200) throw new Error("You can email up to 200 leads at a time");

  const sender = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { ownerName: true, companyName: true, name: true },
  });

  const { getUserRotationConfig } = await import("@/lib/email-rotation");
  const { listAvailableSenders } = await import("@/lib/user-smtp");

  const rotConfig = await getUserRotationConfig(opts.userId);
  const strategy = opts.rotationStrategy || rotConfig.strategy || "even-distribution";
  const delaySec = opts.delaySeconds ?? rotConfig.delaySeconds ?? 2;
  const throttle = opts.throttleMs ?? Math.max(200, delaySec * 1000);

  // If auto-rotate (no specific mailbox forced), resolve pool of active mailboxes
  let activeSenders: Array<{ id: string; label: string; fromEmail: string }> = [];
  if (!opts.smtpAccountId) {
    const available = await listAvailableSenders(opts.userId);
    activeSenders = available.accounts.filter((a) => a.enabled);
  }

  const results: BulkEmailResult[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Calculate distribution allocation if even-distribution is used
  const poolSize = activeSenders.length || 1;
  const perMailboxCap = opts.emailsPerDomain || rotConfig.emailsPerDomain || Math.max(1, Math.ceil(leadIds.length / poolSize));

  for (let idx = 0; idx < leadIds.length; idx++) {
    const leadId = leadIds[idx];
    const lead = await findOwnedLead(opts.userId, leadId);
    if (!lead) {
      skipped += 1;
      results.push({ leadId, businessName: "Unknown", status: "skipped", reason: "Not found" });
      continue;
    }
    if (!lead.email?.trim()) {
      skipped += 1;
      results.push({
        leadId,
        businessName: lead.businessName,
        status: "skipped",
        reason: "No email address",
      });
      continue;
    }

    // Determine sender for this lead based on rotation strategy
    let chosenAccountId = opts.smtpAccountId;
    if (!chosenAccountId && activeSenders.length > 0) {
      if (strategy === "even-distribution") {
        // e.g. 50 leads across 25 domains -> 2 leads per domain
        const mailboxIdx = Math.floor(idx / perMailboxCap) % activeSenders.length;
        chosenAccountId = activeSenders[mailboxIdx]?.id || null;
      } else if (strategy === "round-robin") {
        // 1 by 1 alternating
        const mailboxIdx = idx % activeSenders.length;
        chosenAccountId = activeSenders[mailboxIdx]?.id || null;
      }
    }

    const vars = leadTemplateVars(lead, sender ?? {});
    try {
      await sendLeadEmail({
        userId: opts.userId,
        leadId,
        subject: renderTemplate(subjectTpl, vars),
        body: renderTemplate(bodyTpl, vars),
        smtpAccountId: chosenAccountId,
      });
      sent += 1;
      results.push({ leadId, businessName: lead.businessName, status: "sent" });
    } catch (e) {
      failed += 1;
      results.push({
        leadId,
        businessName: lead.businessName,
        status: "failed",
        reason: e instanceof Error ? e.message : "Send failed",
      });
    }

    if (throttle > 0 && idx < leadIds.length - 1) {
      await new Promise((r) => setTimeout(r, throttle));
    }
  }

  await logActivity(
    opts.userId,
    "bulk_email_sent",
    `Bulk email to ${sent} lead(s) using ${strategy} rotation`,
    { sent, skipped, failed, total: leadIds.length, strategy, throttleMs: throttle },
  );

  return { sent, skipped, failed, results };
}

/**
 * Reply to an inbound LeadEmail (or any thread message for that lead).
 */
export async function replyToLeadEmail(opts: {
  userId: string;
  emailId: string;
  body: string;
  subject?: string;
  smtpAccountId?: string | null;
}) {
  const original = await prisma.leadEmail.findFirst({
    where: { id: opts.emailId, userId: opts.userId },
    include: { lead: { select: { id: true, businessName: true, email: true } } },
  });
  if (!original) throw new Error("Email not found");

  const body = opts.body.trim();
  if (!body) throw new Error("Reply body is required");

  const baseSubject = original.subject || "(no subject)";
  const subject =
    opts.subject?.trim() ||
    (baseSubject.toLowerCase().startsWith("re:")
      ? baseSubject
      : `Re: ${baseSubject}`);

  // RFC 5322: References lists ancestors first, then the message being replied to.
  const refs = [
    ...new Set([original.inReplyTo, original.messageId].filter((v): v is string => Boolean(v))),
  ].join(" ");

  // Reply from the same mailbox the thread used (user account or system account).
  const mailboxId =
    opts.smtpAccountId || original.smtpAccountId || original.systemSmtpAccountId || null;

  const result = await sendLeadEmail({
    userId: opts.userId,
    leadId: original.leadId,
    subject,
    body,
    smtpAccountId: mailboxId,
    inReplyToMessageId: original.messageId,
    references: refs || original.messageId,
    track: false,
  });

  if (!original.readAt && original.direction === "inbound") {
    await prisma.leadEmail.update({
      where: { id: original.id },
      data: { readAt: new Date() },
    });
  }

  return result;
}

/**
 * Record an inbound reply (from webhook). Matches lead by from-address.
 * Pauses active email sequences for that lead.
 */
export async function ingestInboundEmail(opts: {
  userId?: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  messageId?: string;
  inReplyTo?: string;
  /** Raw References header (space-separated Message-IDs) */
  references?: string;
  /** Lower-case auto-reply related headers, e.g. { "auto-submitted": "auto-replied" } */
  headers?: Record<string, string>;
  systemSmtpAccountId?: string | null;
  smtpAccountId?: string | null;
  receivedAt?: Date | null;
}) {
  const sender = opts.fromEmail.trim().toLowerCase();
  const to = opts.toEmail.trim().toLowerCase();
  if (!sender || !to) throw new Error("fromEmail and toEmail are required");
  // A bounce comes from mailer-daemon: file it under the lead it was sent to.
  const isDaemon =
    /^(mailer-daemon|postmaster)@/.test(sender) ||
    (opts.headers?.["content-type"] ?? "").toLowerCase().includes("multipart/report");
  const { bouncedRecipientFromBody } = await import("@/lib/unibox/threads");
  const from = (isDaemon && bouncedRecipientFromBody(opts.body || "")) || sender;

  // Prefer matching a lead email owned by an agency that uses `to` as SMTP from
  const smtpOwners = await prisma.smtpAccount.findMany({
    where: {
      enabled: true,
      OR: [
        { fromEmail: { equals: to, mode: "insensitive" } },
        { username: { equals: to, mode: "insensitive" } },
      ],
      ...(opts.userId ? { userId: opts.userId } : {}),
    },
    select: { userId: true, id: true },
  });

  const userIds = [...new Set(smtpOwners.map((s) => s.userId))];
  if (!userIds.length && opts.userId) userIds.push(opts.userId);
  if (!userIds.length) {
    return { matched: false as const, reason: "no_smtp_owner" as const };
  }

  for (const userId of userIds) {
    let saved = await prisma.savedLead.findFirst({
      where: {
        userId,
        lead: { email: { equals: from, mode: "insensitive" } },
      },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!saved) {
      let targetLead = await prisma.lead.findFirst({
        where: { email: { equals: from, mode: "insensitive" } },
      });
      if (!targetLead) {
        const defaultName = from.split("@")[0].replace(/[._-]/g, " ");
        const nameCap = defaultName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        targetLead = await prisma.lead.create({
          data: {
            businessName: nameCap || from,
            email: from,
            industry: "General",
            city: "Unknown",
            state: "US",
            country: "US",
            qualityTier: "Standard",
            leadScore: 50,
          },
        });
      }

      saved = await prisma.savedLead.create({
        data: {
          userId,
          leadId: targetLead.id,
          status: "contacted",
        },
        include: { lead: true },
      });
    }

    const email = await prisma.leadEmail.create({
      data: {
        userId,
        leadId: saved.leadId,
        savedLeadId: saved.id,
        smtpAccountId:
          opts.smtpAccountId ||
          smtpOwners.find((s) => s.userId === userId)?.id ||
          null,
        systemSmtpAccountId: opts.systemSmtpAccountId || null,
        direction: "inbound",
        fromEmail: sender,
        toEmail: to,
        subject: opts.subject || "(no subject)",
        body: opts.body || "",
        status: "received",
        messageId: opts.messageId || null,
        inReplyTo: opts.inReplyTo || null,
        references: opts.references || null,
        headersJson: opts.headers && Object.keys(opts.headers).length ? JSON.stringify(opts.headers) : null,
        createdAt: opts.receivedAt || new Date(),
      },
    });

    await prisma.emailEnrollment.updateMany({
      where: { userId, savedLeadId: saved.id, status: "active" },
      data: { status: "paused", lastError: "Paused — lead replied" },
    });

    // Unibox: thread, campaign match and label (never blocks ingestion)
    let thread: Awaited<ReturnType<typeof import("@/lib/unibox/threads").attachInboundMessage>> = null;
    try {
      const { attachInboundMessage } = await import("@/lib/unibox/threads");
      thread = await attachInboundMessage(email.id);
    } catch (err) {
      console.error("[unibox] thread attach failed", err instanceof Error ? err.message : err);
    }

    // Any reply stops this workspace's follow-ups to the lead (spec rule 1); a bounce marks
    // the prospect bounced instead. Scoped to this workspace's campaigns only.
    try {
      const { triggerFollowUpStopLogic } = await import("@/lib/campaign-runner");
      if (thread?.classification.bounce) {
        await triggerFollowUpStopLogic(thread.contactEmail, "bounced", { userId });
      } else {
        await triggerFollowUpStopLogic(from, "replied", { userId });
      }
    } catch {
      /* ignore */
    }

    if (saved.status === "new") {
      await prisma.savedLead.update({
        where: { id: saved.id },
        data: { status: "contacted" },
      });
    }

    await logActivity(
      userId,
      "email_received",
      `Reply from ${saved.lead.businessName} <${from}>`,
      { leadId: saved.leadId, emailId: email.id },
    );

    return {
      matched: true as const,
      userId,
      leadId: saved.leadId,
      emailId: email.id,
    };
  }

  return { matched: false as const, reason: "no_lead_match" as const };
}
