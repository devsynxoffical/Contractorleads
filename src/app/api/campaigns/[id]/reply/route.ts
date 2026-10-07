import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendOutboundEmail } from "@/lib/user-smtp";
import { formatEmailBodyToHtml } from "@/lib/campaign-types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const data = await req.json();
    const { prospectId, subject, body, mailboxId } = data;

    if (!prospectId || !subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: "Prospect ID, subject, and message body are required." },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const prospect = await prisma.campaignProspect.findUnique({
      where: { id: prospectId, campaignId: id },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found in this campaign" }, { status: 404 });
    }

    const chosenMailboxId = mailboxId || prospect.lastMailboxId;

    const renderedHtml = formatEmailBodyToHtml(body.trim(), {
      enableUnsubscribe: false,
    });

    const sendResult = await sendOutboundEmail({
      userId: user.id,
      to: prospect.email,
      subject: subject.trim(),
      text: body.trim(),
      html: renderedHtml,
      accountId: chosenMailboxId || undefined,
    });

    // Create campaign log for this direct reply
    const log = await prisma.campaignLog.create({
      data: {
        campaignId: campaign.id,
        prospectId: prospect.id,
        stepIndex: prospect.currentStepIndex,
        hookId: prospect.assignedHookId,
        mailboxId: chosenMailboxId || null,
        fromEmail: sendResult.fromEmail,
        toEmail: prospect.email,
        subject: subject.trim(),
        body: body.trim(),
        status: "sent",
        messageId: sendResult.messageId ?? null,
      },
    });

    // Update prospect status and last sent time
    await prisma.campaignProspect.update({
      where: { id: prospect.id },
      data: {
        lastSentAt: new Date(),
        lastFromEmail: sendResult.fromEmail,
        lastSubject: subject.trim(),
        status: prospect.status === "pending" ? "in_progress" : prospect.status,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Email successfully sent to ${prospect.email}!`,
      log,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send reply";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
