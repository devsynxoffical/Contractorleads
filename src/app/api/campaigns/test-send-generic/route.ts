import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sendOutboundEmail } from "@/lib/user-smtp";
import { renderCampaignTemplate, formatEmailBodyToHtml, type CampaignAttachment } from "@/lib/campaign-engine";
import { appBaseUrl } from "@/lib/email-brand";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      testEmail,
      subject,
      body: bodyText,
      accountId,
      mailboxId,
      mailboxIds,
      attachments,
      enableUnsubscribe,
      unsubscribeText,
    } = body;

    if (!testEmail?.trim() || !testEmail.includes("@")) {
      return NextResponse.json({ error: "Valid test email is required" }, { status: 400 });
    }

    const targetAccountId =
      accountId ||
      mailboxId ||
      (Array.isArray(mailboxIds) && mailboxIds.length > 0 ? mailboxIds[0] : null);

    const sampleProspect = {
      businessName: "Acme Roofing Pros",
      ownerName: "John Smith",
      city: "Orlando",
      state: "FL",
      country: "US",
    };

    const senderName = user.ownerName || user.name || user.companyName || "Our Team";
    const renderedSubj = `[TEST] ${renderCampaignTemplate(subject || "Quick question", sampleProspect, senderName)}`;
    const renderedBody = renderCampaignTemplate(bodyText || "Hi John,\n\nTest outreach email.", sampleProspect, senderName);

    const stepAttachments: CampaignAttachment[] = Array.isArray(attachments) ? attachments : [];
    const baseAppUrl = appBaseUrl();
    const unsubUrl = `${baseAppUrl}/unsubscribe?token=test_preview_token`;

    const renderedHtml = formatEmailBodyToHtml(renderedBody, {
      attachments: stepAttachments,
      enableUnsubscribe: Boolean(enableUnsubscribe),
      unsubscribeText,
      unsubscribeUrl: unsubUrl,
    });

    const outboundAttachments = stepAttachments
      .filter((a) => a.contentBase64)
      .map((a) => ({
        filename: a.name,
        content: Buffer.from(a.contentBase64!.replace(/^data:[^;]+;base64,/, ""), "base64"),
        contentType: a.type,
      }));

    const result = await sendOutboundEmail({
      userId: user.id,
      accountId: targetAccountId,
      to: testEmail.trim(),
      subject: renderedSubj,
      text: renderedBody,
      html: renderedHtml,
      attachments: outboundAttachments.length > 0 ? outboundAttachments : undefined,
    });

    return NextResponse.json({
      ok: true,
      result: {
        to: testEmail.trim(),
        from: result.fromEmail,
        subject: renderedSubj,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Test send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
