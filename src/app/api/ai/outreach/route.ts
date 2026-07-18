import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getSessionUser, buildBusinessContext } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { prisma } from "@/lib/prisma";

const typePrompts: Record<string, string> = {
  email: "Write a concise cold email",
  sms: "Write a short cold SMS under 300 characters",
  followup: "Write a follow-up message for a lead who didn't respond",
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

  try {
    await deductCredits(user.id, CREDIT_COSTS.outreach, "outreach");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
    return NextResponse.json({ error: "Credit error" }, { status: 500 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
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
    content = `${typePrompts[type]} for ${lead.businessName}.

Hi — I work with ${user.companyName || "agencies"} helping ${lead.industry} contractors in ${lead.state} book more estimates. Noticed ${lead.businessName} has solid reviews but may be leaving demand on the table in paid search.

${user.mainGoal || "We help you get more booked jobs."}

Open to a quick 15-min call this week?`;
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
