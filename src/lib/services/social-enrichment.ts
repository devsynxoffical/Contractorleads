import { prisma } from "@/lib/prisma";
import { discoverSocialFromWebsite, searchFacebookPage } from "./facebook";
import { resolveLinkedInProfiles } from "./linkedin";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { matchYelpBusiness } from "./yelp";
import { extractWebsitePeople } from "./website-people";
import { auditWebsite, emptyWebsiteAudit } from "./website-audit";

type LeadRecord = {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  country: string;
  state: string | null;
  city: string | null;
  zip: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export async function enrichLeadSocial(lead: LeadRecord) {
  const location = [lead.city, lead.state, lead.zip, lead.country]
    .filter(Boolean)
    .join(", ");

  const [
    linkedin,
    websiteSocial,
    websitePeople,
    facebookPage,
    yelp,
    houzz,
    nextdoor,
    websiteAudit,
  ] = await Promise.all([
    resolveLinkedInProfiles(
      lead.businessName,
      location,
      lead.industry ?? "Home services",
      lead.ownerName,
      lead.website,
    ),
    lead.website
      ? discoverSocialFromWebsite(lead.website)
      : Promise.resolve({
          facebook: null,
          instagram: null,
          youtube: null,
          tiktok: null,
        }),
    lead.website
      ? extractWebsitePeople(lead.website)
      : Promise.resolve({
          owner: null,
          team: [],
          email: null,
          emailSourceUrl: null,
          pagesChecked: [],
        }),
    !lead.facebook
      ? searchFacebookPage(lead.businessName)
      : Promise.resolve(null),
    matchYelpBusiness(lead.businessName, location),
    matchHouzzBusiness(lead.businessName, location),
    matchNextdoorBusiness(lead.businessName, location),
    lead.website ? auditWebsite(lead.website) : Promise.resolve(emptyWebsiteAudit()),
  ]);

  const companyLinkedIn =
    linkedin.company.confidence >= 90 ? linkedin.company.url : null;
  const ownerLinkedIn =
    linkedin.owner.confidence >= 90 ? linkedin.owner.url : null;
  const primaryLinkedIn = companyLinkedIn ?? ownerLinkedIn;

  const facebook =
    lead.facebook ?? websiteSocial.facebook ?? facebookPage ?? null;
  const instagram = lead.instagram ?? websiteSocial.instagram ?? null;
  const youtube = lead.youtube ?? websiteSocial.youtube ?? null;
  const tiktok = lead.tiktok ?? websiteSocial.tiktok ?? null;

  const auditScores = lead.website
    ? {
        websiteQualityScore: websiteAudit.websiteQualityScore,
        seoOpportunityScore: websiteAudit.seoOpportunityScore,
        marketingOpportunityScore: websiteAudit.marketingOpportunityScore,
        ppcOpportunityScore: websiteAudit.ppcOpportunityScore,
        outreachAngle: websiteAudit.outreachAngle,
      }
    : {
        websiteQualityScore: 18,
        seoOpportunityScore: 88,
        marketingOpportunityScore: 82,
        ppcOpportunityScore: 78,
        outreachAngle: emptyWebsiteAudit().outreachAngle,
      };

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      linkedinUrl: primaryLinkedIn,
      linkedinCompanyUrl: companyLinkedIn,
      linkedinOwnerUrl: ownerLinkedIn,
      linkedinConfidenceScore: linkedin.company.confidence || null,
      linkedinOwnerConfidenceScore: linkedin.owner.confidence || null,
      linkedinType: companyLinkedIn
        ? "company"
        : ownerLinkedIn
          ? "owner"
          : "none",
      // Prefer freshly extracted owner so refreshes correct stale/bad values
      ownerName: websitePeople.owner?.name ?? lead.ownerName ?? undefined,
      ownerTitle: websitePeople.owner?.role,
      ownerSourceUrl: websitePeople.owner?.sourceUrl,
      ownerConfidence: websitePeople.owner?.confidence,
      teamMembersJson: websitePeople.team.length
        ? JSON.stringify(websitePeople.team)
        : undefined,
      peopleEnrichedAt: lead.website ? new Date() : undefined,
      email: lead.email ?? websitePeople.email ?? undefined,
      emailSourceUrl: websitePeople.emailSourceUrl ?? undefined,
      facebook,
      instagram,
      youtube,
      tiktok,
      yelpUrl: yelp?.url ?? undefined,
      yelpRating: yelp?.rating ?? undefined,
      yelpReviews: yelp?.reviewCount ?? undefined,
      houzzUrl: houzz?.url ?? undefined,
      houzzRating: houzz?.rating ?? undefined,
      houzzReviews: houzz?.reviewCount ?? undefined,
      nextdoor: nextdoor?.url ?? undefined,
      socialEnrichedAt: new Date(),
      ...auditScores,
    },
  });

  return {
    lead: updated,
    found: {
      linkedinCompany: Boolean(companyLinkedIn),
      linkedinOwner: Boolean(ownerLinkedIn),
      owner: Boolean(websitePeople.owner),
      team: websitePeople.team.length > 0,
      email: Boolean(!lead.email && websitePeople.email),
      facebook: Boolean(
        !lead.facebook && (websiteSocial.facebook || facebookPage),
      ),
      instagram: Boolean(!lead.instagram && websiteSocial.instagram),
      youtube: Boolean(!lead.youtube && websiteSocial.youtube),
      tiktok: Boolean(!lead.tiktok && websiteSocial.tiktok),
      houzz: Boolean(houzz?.url),
      nextdoor: Boolean(nextdoor?.url),
      yelp: Boolean(yelp?.url),
    },
  };
}

/**
 * AI verification score based on how complete contact + social signals are.
 * Missing common fields keep the score well below 100 so "100/100" is rare
 * and only happens when contact + multiple social channels are present.
 */
export function computeVerificationScore(lead: {
  phone: string | null;
  email: string | null;
  website: string | null;
  googleRating: number | null;
  reviewCount?: number | null;
  linkedinCompanyUrl: string | null;
  linkedinOwnerUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  yelpUrl: string | null;
  youtube?: string | null;
  tiktok?: string | null;
}): number {
  let score = 0;

  // Contact (max 42)
  if (lead.phone?.trim()) score += 14;
  if (lead.email?.trim()) score += 14;
  if (lead.website?.trim()) score += 14;

  // Trust signals (max 18)
  const rating = lead.googleRating ?? 0;
  if (rating >= 4.5) score += 10;
  else if (rating >= 4) score += 7;
  else if (rating >= 3) score += 3;
  const reviews = lead.reviewCount ?? 0;
  if (reviews >= 50) score += 8;
  else if (reviews >= 15) score += 5;
  else if (reviews >= 5) score += 2;

  // Social verification (max 40) — high scores need real social presence
  if (lead.linkedinCompanyUrl?.trim()) score += 9;
  if (lead.linkedinOwnerUrl?.trim()) score += 9;
  if (lead.facebook?.trim()) score += 7;
  if (lead.instagram?.trim()) score += 6;
  if (lead.yelpUrl?.trim()) score += 4;
  if (lead.youtube?.trim()) score += 3;
  if (lead.tiktok?.trim()) score += 2;

  return Math.max(0, Math.min(100, score));
}

export function verificationScoreMessage(score: number): string {
  if (score >= 90) {
    return "Strong verification — contact and multiple social profiles are present.";
  }
  if (score >= 70) {
    return "Solid contact data. Fetch more social profiles to push this higher.";
  }
  if (score >= 45) {
    return "Partial verification — some contact fields are present. Run Fetch on social profiles to improve this score.";
  }
  return "Limited signals so far. Add or fetch phone, email, website, and social profiles to raise this score.";
}
