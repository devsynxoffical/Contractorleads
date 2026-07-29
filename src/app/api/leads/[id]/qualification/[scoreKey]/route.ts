import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { prisma } from "@/lib/prisma";
import {
  generateQualificationDetailReport,
  isQualificationScoreKey,
  QUALIFICATION_SCORE_META,
} from "@/lib/services/qualification-detail-report";
import { auditWebsite, emptyWebsiteAudit } from "@/lib/services/website-audit";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string; scoreKey: string }>;
};

function scoreFromLead(
  lead: {
    websiteQualityScore: number | null;
    seoOpportunityScore: number | null;
    marketingOpportunityScore: number | null;
    ppcOpportunityScore: number | null;
  },
  scoreKey: keyof typeof QUALIFICATION_SCORE_META,
  audit: {
    websiteQualityScore: number;
    seoOpportunityScore: number;
    marketingOpportunityScore: number;
    ppcOpportunityScore: number;
  },
) {
  switch (scoreKey) {
    case "websiteQuality":
      return audit.websiteQualityScore ?? lead.websiteQualityScore ?? 0;
    case "seoOpportunity":
      return audit.seoOpportunityScore ?? lead.seoOpportunityScore ?? 0;
    case "marketingOpportunity":
      return (
        audit.marketingOpportunityScore ?? lead.marketingOpportunityScore ?? 0
      );
    case "ppcOpportunity":
      return audit.ppcOpportunityScore ?? lead.ppcOpportunityScore ?? 0;
  }
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, scoreKey: rawKey } = await params;
  if (!isQualificationScoreKey(rawKey)) {
    return NextResponse.json({ error: "Invalid score type" }, { status: 400 });
  }

  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const meta = QUALIFICATION_SCORE_META[rawKey];
  const existing = await prisma.script.findFirst({
    where: {
      userId: user.id,
      relatedLeadId: id,
      type: meta.scriptType,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    meta,
    scoreKey: rawKey,
    report: existing,
    creditCost: CREDIT_COSTS.qualificationDetail ?? 1,
    lead: {
      id: lead.id,
      businessName: lead.businessName,
      website: lead.website,
      industry: lead.industry,
      city: lead.city,
      state: lead.state,
      websiteQualityScore: lead.websiteQualityScore,
      seoOpportunityScore: lead.seoOpportunityScore,
      marketingOpportunityScore: lead.marketingOpportunityScore,
      ppcOpportunityScore: lead.ppcOpportunityScore,
      outreachAngle: lead.outreachAngle,
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, scoreKey: rawKey } = await params;
  if (!isQualificationScoreKey(rawKey)) {
    return NextResponse.json({ error: "Invalid score type" }, { status: 400 });
  }

  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    force?: boolean;
  };
  const meta = QUALIFICATION_SCORE_META[rawKey];

  if (!body.force) {
    const existing = await prisma.script.findFirst({
      where: {
        userId: user.id,
        relatedLeadId: id,
        type: meta.scriptType,
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return NextResponse.json({
        report: existing,
        source: "cached",
        creditCost: CREDIT_COSTS.qualificationDetail ?? 1,
      });
    }
  }

  const cost = CREDIT_COSTS.qualificationDetail ?? 1;
  try {
    await deductCredits(user.id, cost, "qualification_detail", id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: "Credit error" }, { status: 500 });
  }

  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website, { timeoutMs: 16000 })
    : emptyWebsiteAudit();

  // Persist measured scores so the lead stays in sync
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      websiteQualityScore: lead.website?.trim()
        ? audit.websiteQualityScore
        : 18,
      seoOpportunityScore: lead.website?.trim()
        ? audit.seoOpportunityScore
        : 88,
      marketingOpportunityScore: lead.website?.trim()
        ? audit.marketingOpportunityScore
        : 82,
      ppcOpportunityScore: lead.website?.trim()
        ? audit.ppcOpportunityScore
        : 78,
      outreachAngle: audit.outreachAngle,
    },
  });

  const score = scoreFromLead(lead, rawKey, audit);
  const result = await generateQualificationDetailReport({
    scoreKey: rawKey,
    businessName: lead.businessName,
    website: lead.website,
    industry: lead.industry,
    city: lead.city,
    state: lead.state,
    googleRating: lead.googleRating,
    reviewCount: lead.reviewCount,
    instagram: lead.instagram,
    facebook: lead.facebook,
    audit,
    score,
  });

  const report = await prisma.script.create({
    data: {
      userId: user.id,
      type: meta.scriptType,
      title: `${meta.label} detail — ${lead.businessName}`,
      content: result.content,
      relatedLeadId: id,
    },
  });

  await logActivity(
    user.id,
    "qualification_detail",
    `Generated ${meta.label} detail for ${lead.businessName}`,
  );

  const credits = await prisma.user.findUnique({
    where: { id: user.id },
    select: { creditsRemaining: true },
  });

  return NextResponse.json({
    report,
    source: result.source,
    score,
    audit: {
      reachable: audit.reachable,
      https: audit.https,
      title: audit.title,
      wordCount: audit.wordCount,
      hasContactForm: audit.hasContactForm,
      hasLocalBusinessSchema: audit.hasLocalBusinessSchema,
      likelySpaShell: audit.likelySpaShell,
    },
    creditsRemaining: credits?.creditsRemaining,
    creditCost: cost,
  });
}
