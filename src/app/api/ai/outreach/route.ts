import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getSessionUser, buildBusinessContext } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { prisma } from "@/lib/prisma";
import { findOwnedLead } from "@/lib/lead-ownership";

const typePrompts: Record<string, string> = {
  email:
    "Write a concise cold email. First line must be exactly 'Subject: <subject>', then a blank line, then the email body only (no Body: label).",
  sms: "Write a short cold SMS under 300 characters. Plain text only — no Subject line.",
  followup:
    "Write a follow-up email for a lead who didn't respond. First line must be exactly 'Subject: <subject>', then a blank line, then the body only.",
  sales_script: "Write a full phone sales script with objection handling",
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId, type } = await request.json();
  if (!leadId || !type || !typePrompts[type]) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Resolve the lead before charging so an unowned id can't burn credits.
  const lead = await findOwnedLead(user.id, leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    await deductCredits(user.id, CREDIT_COSTS.outreach, "outreach");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
    return NextResponse.json({ error: "Credit error" }, { status: 500 });
  }

  const businessContext = buildBusinessContext(user);
  const leadContext = `
Lead: ${lead.businessName}
Location: ${lead.address}
Industry: ${lead.industry}
Phone: ${lead.phone ?? "unknown"}
Website: ${lead.website ?? "none"}
Google Rating: ${lead.googleRating ?? "n/a"} (${lead.reviewCount ?? 0} reviews)
Lead Score: ${lead.leadScore}
Outreach Angle: ${lead.outreachAngle ?? "n/a"}
`;

  const apiKey = getOpenAIApiKey();
  let content: string;

  if (!apiKey) {
    if (type === "sms") {
      content = `Hi — quick note from ${user.companyName || "our team"}. Noticed ${lead.businessName} and thought we could help book more estimates. Open to a short chat?`;
    } else if (type === "sales_script") {
      content = `Phone script for ${lead.businessName}\n\nOpener: Hi, I work with ${user.companyName || "agencies"} helping ${lead.industry} contractors book more estimates...\n\nValue: ${user.mainGoal || "We help you get more booked jobs."}\n\nClose: Open to a quick 15-min call this week?`;
    } else {
      content = `Subject: Quick idea for ${lead.businessName}\n\nHi — I work with ${user.companyName || "agencies"} helping ${lead.industry} contractors in ${lead.state} book more estimates. Noticed ${lead.businessName} has solid reviews but may be leaving demand on the table in paid search.\n\n${user.mainGoal || "We help you get more booked jobs."}\n\nOpen to a quick 15-min call this week?`;
    }
  } else {
    const openai = createOpenAI({ apiKey });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `${typePrompts[type]} personalized for this lead. Direct-response style, no fluff.

Sender business:
${businessContext}

Lead data:
${leadContext}`,
    });
    content = text;
  }

  const script = await prisma.script.create({
    data: {
      userId: user.id,
      type,
      title: `${type} — ${lead.businessName}`,
      content,
      relatedLeadId: leadId,
    },
  });

  await logActivity(user.id, "outreach", `Generated ${type} for ${lead.businessName}`);

  const credits = await prisma.user.findUnique({
    where: { id: user.id },
    select: { creditsRemaining: true },
  });

  return NextResponse.json({
    script,
    creditsRemaining: credits?.creditsRemaining,
  });
}
