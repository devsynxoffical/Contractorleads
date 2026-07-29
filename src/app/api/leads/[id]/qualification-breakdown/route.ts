import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { buildQualificationBreakdown } from "@/lib/services/qualification-breakdown";
import { auditWebsite, emptyWebsiteAudit } from "@/lib/services/website-audit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const persist = url.searchParams.get("persist") === "1";

  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website, { timeoutMs: 12000 })
    : null;

  const breakdown = buildQualificationBreakdown(
    {
      website: lead.website,
      googleRating: lead.googleRating,
      reviewCount: lead.reviewCount,
      websiteQualityScore: lead.websiteQualityScore,
      seoOpportunityScore: lead.seoOpportunityScore,
      marketingOpportunityScore: lead.marketingOpportunityScore,
      ppcOpportunityScore: lead.ppcOpportunityScore,
    },
    audit,
  );

  let saved = false;
  if (persist && breakdown.measuredScores) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        websiteQualityScore: breakdown.measuredScores.websiteQualityScore,
        seoOpportunityScore: breakdown.measuredScores.seoOpportunityScore,
        marketingOpportunityScore:
          breakdown.measuredScores.marketingOpportunityScore,
        ppcOpportunityScore: breakdown.measuredScores.ppcOpportunityScore,
        outreachAngle: breakdown.measuredScores.outreachAngle,
      },
    });
    saved = true;
  }

  return NextResponse.json({
    ...breakdown,
    persisted: saved,
    audit: audit
      ? {
          reachable: audit.reachable,
          https: audit.https,
          title: audit.title,
          wordCount: audit.wordCount,
          likelySpaShell: audit.likelySpaShell,
        }
      : lead.website
        ? {
            reachable: false,
            https: false,
            title: null,
            wordCount: 0,
            likelySpaShell: false,
          }
        : {
            reachable: false,
            https: false,
            title: null,
            wordCount: 0,
            likelySpaShell: false,
          },
  });
}

/** Re-crawl the site and save measured scores onto the lead. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website, { timeoutMs: 12000 })
    : emptyWebsiteAudit();

  const breakdown = buildQualificationBreakdown(
    {
      website: lead.website,
      googleRating: lead.googleRating,
      reviewCount: lead.reviewCount,
      websiteQualityScore: lead.websiteQualityScore,
      seoOpportunityScore: lead.seoOpportunityScore,
      marketingOpportunityScore: lead.marketingOpportunityScore,
      ppcOpportunityScore: lead.ppcOpportunityScore,
    },
    lead.website?.trim() ? audit : null,
  );

  const scores = breakdown.measuredScores!;
  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      websiteQualityScore: scores.websiteQualityScore,
      seoOpportunityScore: scores.seoOpportunityScore,
      marketingOpportunityScore: scores.marketingOpportunityScore,
      ppcOpportunityScore: scores.ppcOpportunityScore,
      outreachAngle: scores.outreachAngle,
    },
    select: {
      id: true,
      websiteQualityScore: true,
      seoOpportunityScore: true,
      marketingOpportunityScore: true,
      ppcOpportunityScore: true,
      outreachAngle: true,
    },
  });

  return NextResponse.json({
    ...breakdown,
    lead: updated,
    persisted: true,
  });
}
