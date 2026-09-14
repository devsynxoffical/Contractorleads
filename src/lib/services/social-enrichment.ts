import { prisma } from "@/lib/prisma";
import { searchFacebookPage } from "./facebook";
import { resolveLinkedInProfiles } from "./linkedin";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { matchYelpBusiness } from "./yelp";
import { extractWebsitePeople, pickBestEmail } from "./website-people";
import { auditWebsite, emptyWebsiteAudit } from "./website-audit";
import {
  scrapeWebsiteSocialPack,
  EMPTY_WEBSITE_SOCIAL_PACK,
} from "./website-social-pack";
import {
  discoverOwnerFromSearch,
  EMPTY_OWNER_DISCOVERY,
  plausiblePersonName,
} from "./owner-discovery";

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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
    websitePack,
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
      ? scrapeWebsiteSocialPack(lead.website)
      : Promise.resolve(EMPTY_WEBSITE_SOCIAL_PACK),
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
    withTimeout(matchYelpBusiness(lead.businessName, location), 3000, null),
    withTimeout(matchHouzzBusiness(lead.businessName, location), 3000, null),
    withTimeout(matchNextdoorBusiness(lead.businessName, location), 3000, null),
    lead.website
      ? auditWebsite(lead.website, { timeoutMs: 12000 })
      : Promise.resolve(emptyWebsiteAudit()),
  ]);

  const companyLinkedIn =
    linkedin.company.confidence >= 90 ? linkedin.company.url : null;
  const ownerLinkedIn =
    linkedin.owner.confidence >= 90 ? linkedin.owner.url : null;
  const primaryLinkedIn = companyLinkedIn ?? ownerLinkedIn;

  const validLeadOwner =
    lead.ownerName && plausiblePersonName(lead.ownerName, lead.businessName)
      ? lead.ownerName
      : null;

  const validWebsiteOwner =
    websiteOwnerName && plausiblePersonName(websiteOwnerName, lead.businessName)
      ? websiteOwnerName
      : null;

  const ownerFromSearch =
    validWebsiteOwner || validLeadOwner
      ? EMPTY_OWNER_DISCOVERY
      : await withTimeout(
          discoverOwnerFromSearch(lead.businessName, location),
          9000,
          EMPTY_OWNER_DISCOVERY,
        );

  const validSearchOwner =
    ownerFromSearch.ownerName &&
    plausiblePersonName(ownerFromSearch.ownerName, lead.businessName)
      ? ownerFromSearch.ownerName
      : null;

  const ownerLinkedInFromSearch =
    Boolean(ownerFromSearch.ownerLinkedInUrl) && !ownerLinkedIn;
  const ownerLinkedInFinal =
    ownerLinkedIn || ownerFromSearch.ownerLinkedInUrl || null;

  const ownerNameFinal =
    validWebsiteOwner ?? validSearchOwner ?? validLeadOwner ?? null;
  const ownerTitleFinal = validWebsiteOwner
    ? websitePeople.owner?.role ?? null
    : validSearchOwner
      ? ownerFromSearch.ownerRole ?? null
      : validLeadOwner
        ? lead.ownerTitle ?? null
        : null;
  const ownerSourceUrlFinal = validWebsiteOwner
    ? websitePeople.owner?.sourceUrl ?? null
    : validSearchOwner
      ? ownerFromSearch.sourceUrl ?? null
      : validLeadOwner
        ? lead.ownerSourceUrl ?? null
        : null;
  const ownerConfidenceFinal = validWebsiteOwner
    ? websitePeople.owner?.confidence ?? null
    : validSearchOwner
      ? ownerFromSearch.confidence ?? null
      : validLeadOwner
        ? lead.ownerConfidence ?? null
        : null;

  const emailCandidates = [lead.email, websitePeople.email].filter(
    (e): e is string => Boolean(e),
  );
  const emailFinal =
    pickBestEmail(emailCandidates, ownerNameFinal, lead.website) ??
    websitePeople.email ??
    lead.email ??
    null;
  const emailSourceUrlFinal =
    emailFinal === websitePeople.email
      ? websitePeople.emailSourceUrl ?? undefined
      : undefined;

  const facebook =
    lead.facebook ?? websitePack.facebook ?? facebookPage ?? null;
  const instagram = lead.instagram ?? websitePack.instagram ?? null;
  const youtube = lead.youtube ?? websitePack.youtube ?? null;
  const tiktok = lead.tiktok ?? websitePack.tiktok ?? null;

  const yelpUrlFinal = websitePack.yelp ?? yelp?.url ?? undefined;
  const houzzUrlFinal = websitePack.houzz ?? houzz?.url ?? undefined;
  const nextdoorUrlFinal = websitePack.nextdoor ?? nextdoor?.url ?? undefined;

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
      linkedinOwnerUrl: ownerLinkedInFinal,
      linkedinConfidenceScore: linkedin.company.confidence || null,
      linkedinOwnerConfidenceScore: ownerLinkedInFinal
        ? ownerLinkedInFromSearch
          ? Math.max(ownerFromSearch.confidence, 90)
          : linkedin.owner.confidence || null
        : undefined,
      linkedinType: companyLinkedIn
        ? "company"
        : ownerLinkedInFinal
          ? "owner"
          : "none",
      // Prefer freshly validated owner
      ownerName: ownerNameFinal,
      ownerTitle: ownerTitleFinal,
      ownerSourceUrl: ownerSourceUrlFinal,
      ownerConfidence: ownerConfidenceFinal,
      teamMembersJson: websitePeople.team.length
        ? JSON.stringify(websitePeople.team)
        : undefined,
      peopleEnrichedAt:
        lead.website || validWebsiteOwner || validSearchOwner
          ? new Date()
          : undefined,
      email: emailFinal,
      emailSourceUrl: emailSourceUrlFinal,
      facebook,
      instagram,
      youtube,
      tiktok,
      yelpUrl: yelpUrlFinal,
      yelpRating: yelp?.rating ?? undefined,
      yelpReviews: yelp?.reviewCount ?? undefined,
      houzzUrl: houzzUrlFinal,
      houzzRating: houzz?.rating ?? undefined,
      houzzReviews: houzz?.reviewCount ?? undefined,
      nextdoor: nextdoorUrlFinal,
      socialEnrichedAt: new Date(),
      ...auditScores,
    },
  });

  return {
    lead: updated,
    found: {
      linkedinCompany: Boolean(companyLinkedIn),
      linkedinOwner: Boolean(ownerLinkedIn),
      owner: Boolean(websitePeople.owner || ownerFromSearch.ownerName),
      team: websitePeople.team.length > 0,
      email: Boolean(!lead.email && websitePeople.email),
      facebook: Boolean(
        !lead.facebook && (websitePack.facebook || facebookPage),
      ),
      instagram: Boolean(!lead.instagram && websitePack.instagram),
      youtube: Boolean(!lead.youtube && websitePack.youtube),
      tiktok: Boolean(!lead.tiktok && websitePack.tiktok),
      houzz: Boolean(websitePack.houzz || houzz?.url),
      nextdoor: Boolean(websitePack.nextdoor || nextdoor?.url),
      yelp: Boolean(websitePack.yelp || yelp?.url),
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
