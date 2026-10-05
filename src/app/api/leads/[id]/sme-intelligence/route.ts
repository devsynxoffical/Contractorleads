import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { processSmeIntelligence } from "@/lib/services/sme-intelligence";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const lead = await findAccessibleLead(user, leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Crawl website homepage for text context if website exists
  let websiteHtml: string | null = null;
  if (lead.website) {
    try {
      const res = await fetch(lead.website, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ContractorLeads/1.0; +https://contractorleads.us)" },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        websiteHtml = await res.text();
      }
    } catch {
      /* ignore fetch errors */
    }
  }

  const smeResult = await processSmeIntelligence({
    businessName: lead.businessName,
    website: lead.website,
    phone: lead.phone,
    email: lead.email,
    ownerName: lead.ownerName,
    ownerTitle: lead.ownerTitle,
    linkedinUrl: lead.linkedinUrl,
    yearsInBusiness: lead.yearsInBusiness,
    reviewCount: lead.reviewCount,
    googleRating: lead.googleRating,
    country: lead.country,
    state: lead.state,
    city: lead.city,
    websiteHtml,
  });

  // Save extracted SME intelligence to the lead record
  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      businessEstablishedDate: smeResult.businessEstablishedDate,
      businessAgeYears: smeResult.businessAgeYears,
      businessAgeSource: smeResult.businessAgeSource,
      businessAgeConfidence: smeResult.businessAgeConfidence,
      businessMaturity: smeResult.businessMaturity,

      domainName: smeResult.domainName,
      domainCreatedDate: smeResult.domainCreatedDate,
      domainUpdatedDate: smeResult.domainUpdatedDate,
      domainExpiryDate: smeResult.domainExpiryDate,
      domainAgeYears: smeResult.domainAgeYears,
      domainRegistrar: smeResult.domainRegistrar,
      domainRegistrationCountry: smeResult.domainRegistrationCountry,
      domainSource: smeResult.domainSource,
      domainConfidence: smeResult.domainConfidence,
      domainPrivacyStatus: smeResult.domainPrivacyStatus,

      employeeCount: smeResult.employeeCount,
      employeeCountSource: smeResult.employeeCountSource,
      employeeCountConfidence: smeResult.employeeCountConfidence,
      companySizeCategory: smeResult.companySizeCategory,
      locationCount: smeResult.locationCount,
      isFranchiseOrEnterprise: smeResult.isFranchiseOrEnterprise,

      decisionMakerFound: smeResult.decisionMakerFound,
      decisionMakerName: smeResult.decisionMakerName,
      decisionMakerFirstName: smeResult.decisionMakerFirstName,
      decisionMakerLastName: smeResult.decisionMakerLastName,
      decisionMakerTitle: smeResult.decisionMakerTitle,
      decisionMakerRole: smeResult.decisionMakerRole,
      decisionMakerLinkedIn: smeResult.decisionMakerLinkedIn,
      decisionMakerEmail: smeResult.decisionMakerEmail,
      decisionMakerEmailType: smeResult.decisionMakerEmailType,
      decisionMakerEmailVerification: smeResult.decisionMakerEmailVerification,
      decisionMakerDirectPhone: smeResult.decisionMakerDirectPhone,
      decisionMakerPhoneType: smeResult.decisionMakerPhoneType,
      decisionMakerSource: smeResult.decisionMakerSource,
      decisionMakerVerified: smeResult.decisionMakerVerified,
      decisionMakerConfidence: smeResult.decisionMakerConfidence,
      decisionMakerVerificationDate: new Date(),

      sourcesCount: smeResult.sourcesCount,
      sourcesUsedJson: JSON.stringify(smeResult.sourcesUsed),
      businessVerified: smeResult.businessVerified,
      smeQualityScore: smeResult.smeQualityScore,
      isLowPriorityOrExcluded: smeResult.isLowPriorityOrExcluded,
      exclusionReasonsJson: JSON.stringify(smeResult.exclusionReasons),
      lastVerifiedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    sme: smeResult,
    lead: updated,
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const lead = await findAccessibleLead(user, leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({
    lead,
  });
}
