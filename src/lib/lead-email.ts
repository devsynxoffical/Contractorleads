import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";
import { sendViaUserSmtp } from "@/lib/user-smtp";

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
}) {
  const subject = opts.subject.trim();
  const body = opts.body.trim();
  if (!subject || !body) {
    throw new Error("Subject and body are required");
  }

  const lead = await prisma.lead.findUnique({ where: { id: opts.leadId } });
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

  try {
    const sent = await sendViaUserSmtp({
      userId: opts.userId,
      to,
      subject,
      text: body,
      accountId: opts.smtpAccountId,
    });

    const emailRow = await prisma.leadEmail.create({
      data: {
        userId: opts.userId,
        leadId: opts.leadId,
        savedLeadId: saved.id,
        smtpAccountId: sent.smtpAccountId,
        direction: "outbound",
        fromEmail: sent.fromEmail,
        toEmail: to,
        subject,
        body,
        status: "sent",
        messageId: sent.messageId,
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
      `Emailed ${lead.businessName} <${to}>`,
      { leadId: lead.id, emailId: emailRow.id, subject },
    );

    return {
      email: emailRow,
      savedLeadId: saved.id,
      status: saved.status === "new" ? "contacted" : saved.status,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    await prisma.leadEmail.create({
      data: {
        userId: opts.userId,
        leadId: opts.leadId,
        savedLeadId: saved.id,
        smtpAccountId: opts.smtpAccountId || null,
        direction: "outbound",
        fromEmail: "",
        toEmail: to,
        subject,
        body,
        status: "failed",
        error: msg,
      },
    });
    throw e;
  }
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
}) {
  const from = opts.fromEmail.trim().toLowerCase();
  const to = opts.toEmail.trim().toLowerCase();
  if (!from || !to) throw new Error("fromEmail and toEmail are required");

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
    const saved = await prisma.savedLead.findFirst({
      where: {
        userId,
        lead: { email: { equals: from, mode: "insensitive" } },
      },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!saved) continue;

    const email = await prisma.leadEmail.create({
      data: {
        userId,
        leadId: saved.leadId,
        savedLeadId: saved.id,
        smtpAccountId: smtpOwners.find((s) => s.userId === userId)?.id ?? null,
        direction: "inbound",
        fromEmail: from,
        toEmail: to,
        subject: opts.subject || "(no subject)",
        body: opts.body || "",
        status: "received",
        messageId: opts.messageId || null,
        inReplyTo: opts.inReplyTo || null,
      },
    });

    await prisma.emailEnrollment.updateMany({
      where: { userId, savedLeadId: saved.id, status: "active" },
      data: { status: "paused", lastError: "Paused — lead replied" },
    });

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
