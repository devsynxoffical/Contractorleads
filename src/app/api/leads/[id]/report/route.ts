import { NextResponse } from "next/server";
import { getSessionUser, buildBusinessContext } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { prisma } from "@/lib/prisma";
import {
  generateLeadIntelligenceReport,
  isLeadReportType,
  LEAD_REPORT_SCRIPT_TYPE,
  LEAD_REPORT_TYPE_META,
  reportTitle,
  type LeadReportType,
} from "@/lib/services/lead-intelligence-report";

export async function GET(
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

  const reports = await prisma.script.findMany({
    where: {
      userId: user.id,
      relatedLeadId: id,
      type: { startsWith: LEAD_REPORT_SCRIPT_TYPE },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    reports,
    reportTypes: LEAD_REPORT_TYPE_META,
    creditCost: CREDIT_COSTS.leadReport,
  });
}

export async function POST(
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

  const body = (await request.json().catch(() => ({}))) as {
    reportType?: unknown;
  };
  const reportType: LeadReportType = isLeadReportType(body.reportType)
    ? body.reportType
    : "website";

  try {
    await deductCredits(
      user.id,
      CREDIT_COSTS.leadReport,
      "lead_report",
      id,
    );
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

  try {
    const result = await generateLeadIntelligenceReport(
      {
        businessName: lead.businessName,
        ownerName: lead.ownerName,
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        industry: lead.industry,
        serviceCategory: lead.serviceCategory,
        googleRating: lead.googleRating,
        reviewCount: lead.reviewCount,
        yearsInBusiness: lead.yearsInBusiness,
        leadScore: lead.leadScore,
        websiteQualityScore: lead.websiteQualityScore,
        seoOpportunityScore: lead.seoOpportunityScore,
        marketingOpportunityScore: lead.marketingOpportunityScore,
        ppcOpportunityScore: lead.ppcOpportunityScore,
        outreachAngle: lead.outreachAngle,
        facebook: lead.facebook,
        instagram: lead.instagram,
        linkedinUrl: lead.linkedinUrl,
        linkedinCompanyUrl: lead.linkedinCompanyUrl,
        linkedinOwnerUrl: lead.linkedinOwnerUrl,
        yelpUrl: lead.yelpUrl,
        yelpRating: lead.yelpRating,
        yelpReviews: lead.yelpReviews,
        agencyContext: buildBusinessContext(user),
      },
      reportType,
    );

    const script = await prisma.script.create({
      data: {
        userId: user.id,
        type: `${LEAD_REPORT_SCRIPT_TYPE}:${reportType}`,
        title: reportTitle(lead.businessName, reportType),
        content: result.content,
        relatedLeadId: id,
      },
    });

    await logActivity(
      user.id,
      "lead_report",
      `Generated ${LEAD_REPORT_TYPE_META[reportType].label} for ${lead.businessName}`,
    );

    const credits = await prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsRemaining: true },
    });

    return NextResponse.json({
      report: script,
      source: result.source,
      creditsRemaining: credits?.creditsRemaining,
      creditCost: CREDIT_COSTS.leadReport,
    });
  } catch (err) {
    console.error("[lead-report]", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
