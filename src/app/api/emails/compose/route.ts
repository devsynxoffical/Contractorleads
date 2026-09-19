import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { sendOutboundEmail, formatSmtpError } from "@/lib/user-smtp";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const toEmail = String(body.toEmail || body.to || "").toLowerCase().trim();
  const subject = String(body.subject || "").trim();
  const text = String(body.body || body.text || "").trim();
  const smtpAccountId = body.smtpAccountId ? String(body.smtpAccountId) : null;
  const leadId = body.leadId ? String(body.leadId) : null;

  if (!toEmail || !toEmail.includes("@")) {
    return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
  }

  if (!subject || !text) {
    return NextResponse.json({ error: "Subject and message body are required" }, { status: 400 });
  }

  // 1. Resolve or create associated Lead record
  let targetLead = leadId ? await prisma.lead.findUnique({ where: { id: leadId } }) : null;

  if (!targetLead) {
    targetLead = await prisma.lead.findFirst({
      where: { email: toEmail },
    });
  }

  if (!targetLead) {
    const defaultName = toEmail.split("@")[0].replace(/[._-]/g, " ");
    const nameCapitalized = defaultName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    targetLead = await prisma.lead.create({
      data: {
        businessName: nameCapitalized || toEmail,
        email: toEmail,
        industry: "General",
        city: "Unknown",
        state: "US",
        country: "US",
        qualityTier: "Standard",
        leadScore: 50,
      },
    });
  }

  // 2. Ensure SavedLead exists for this user
  let saved = await prisma.savedLead.findUnique({
    where: {
      userId_leadId: { userId: user.id, leadId: targetLead.id },
    },
  });

  if (!saved) {
    saved = await prisma.savedLead.create({
      data: {
        userId: user.id,
        leadId: targetLead.id,
        status: "contacted",
      },
    });
  } else if (saved.status === "new") {
    await prisma.savedLead.update({
      where: { id: saved.id },
      data: { status: "contacted" },
    });
  }

  // 3. Send email via user SMTP or Hostinger System SMTP Pool
  try {
    const sent = await sendOutboundEmail({
      userId: user.id,
      to: toEmail,
      subject,
      text,
      accountId: smtpAccountId,
    });

    const isSystemSmtp = Boolean(
      sent.systemSmtpAccountId ||
        (sent.smtpAccountId &&
          (await prisma.systemSmtpAccount.count({ where: { id: sent.smtpAccountId } })) > 0),
    );

    const emailRow = await prisma.leadEmail.create({
      data: {
        userId: user.id,
        leadId: targetLead.id,
        savedLeadId: saved.id,
        smtpAccountId: isSystemSmtp ? null : (sent.smtpAccountId ?? null),
        systemSmtpAccountId: isSystemSmtp ? (sent.systemSmtpAccountId ?? sent.smtpAccountId ?? null) : null,
        direction: "outbound",
        fromEmail: sent.fromEmail,
        toEmail,
        subject,
        body: text,
        status: "sent",
        messageId: sent.messageId,
        trackingToken: sent.trackingToken ?? null,
      },
    });

    await logActivity(
      user.id,
      "email_sent",
      `Sent email to ${targetLead.businessName} <${toEmail}>`,
      { leadId: targetLead.id, emailId: emailRow.id, subject },
    );

    return NextResponse.json({
      ok: true,
      message: `Email sent successfully to ${toEmail}`,
      fromEmail: sent.fromEmail,
      emailId: emailRow.id,
      leadId: targetLead.id,
    });
  } catch (e) {
    const errorMsg = formatSmtpError(e);

    const isSystemSmtp = smtpAccountId
      ? (await prisma.systemSmtpAccount.count({ where: { id: smtpAccountId } })) > 0
      : false;

    await prisma.leadEmail.create({
      data: {
        userId: user.id,
        leadId: targetLead.id,
        savedLeadId: saved.id,
        smtpAccountId: isSystemSmtp ? null : (smtpAccountId || null),
        systemSmtpAccountId: isSystemSmtp ? (smtpAccountId || null) : null,
        direction: "outbound",
        fromEmail: "",
        toEmail,
        subject,
        body: text,
        status: "failed",
        error: errorMsg,
      },
    });

    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
