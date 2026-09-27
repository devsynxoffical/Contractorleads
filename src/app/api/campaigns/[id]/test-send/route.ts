import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  parseCampaignHooks,
  parseCampaignSteps,
  renderCampaignTemplate,
} from "@/lib/campaign-engine";
import { sendOutboundEmail } from "@/lib/user-smtp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { testEmail, hookId, stepIndex = 0 } = body;

    if (!testEmail?.trim() || !testEmail.includes("@")) {
      return NextResponse.json({ error: "Valid test email is required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const hooks = parseCampaignHooks(campaign.hooksJson);
    const steps = parseCampaignSteps(campaign.stepsJson);

    let subject = "";
    let bodyText = "";

    const sampleProspect = {
      businessName: "Acme Roofing Pros",
      ownerName: "John Smith",
      city: campaign.city || "Orlando",
      state: campaign.state || "FL",
      country: campaign.country || "US",
    };

    const senderName =
      user.ownerName || user.name || user.companyName || "Our Team";

    if (stepIndex === 0) {
      const hook = hooks.find((h) => h.id === hookId) || hooks[0];
      subject = `[TEST] ${renderCampaignTemplate(hook.subject, sampleProspect, senderName)}`;
      bodyText = renderCampaignTemplate(hook.body, sampleProspect, senderName);
    } else {
      const step = steps[stepIndex - 1] || steps[0];
      subject = `[TEST] ${renderCampaignTemplate(step.subject, sampleProspect, senderName, { lastSubject: "Quick question for Acme Roofing Pros" })}`;
      bodyText = renderCampaignTemplate(step.body, sampleProspect, senderName, { lastSubject: "Quick question for Acme Roofing Pros" });
    }

    const result = await sendOutboundEmail({
      userId: user.id,
      to: testEmail.trim(),
      subject,
      text: bodyText,
    });

    return NextResponse.json({
      ok: true,
      result: {
        to: testEmail.trim(),
        from: result.fromEmail,
        subject,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Test send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
