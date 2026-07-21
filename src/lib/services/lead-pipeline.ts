import { prisma } from "@/lib/prisma";
import { searchGooglePlaces, verifyWebsite } from "./google-places";
import { matchYelpBusiness } from "./yelp";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { resolveLinkedIn } from "./linkedin";
import { qualifyLead } from "./qualification";
import {
  extractWebsitePeople,
  type WebsitePeopleResult,
} from "./website-people";
import { discoverSocialFromWebsite, searchFacebookPage } from "./facebook";

const EMPTY_PEOPLE: WebsitePeopleResult = {
  owner: null,
  team: [],
  email: null,
  emailSourceUrl: null,
  pagesChecked: [],
};

const EMPTY_SOCIAL = {
  facebook: null as string | null,
  instagram: null as string | null,
  youtube: null as string | null,
  tiktok: null as string | null,
};

export type SearchParams = {
  userId: string;
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state?: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius?: number;
  /** Default true — only keep leads with LinkedIn + social + website owner. */
  requireSocialPresence?: boolean;
};

type SocialFields = {
  linkedinUrl?: string | null;
  linkedinCompanyUrl?: string | null;
  linkedinOwnerUrl?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  ownerName?: string | null;
};

/** LinkedIn + consumer social + owner name scraped from the business website. */
export function leadHasLinkedInSocialAndOwner(lead: SocialFields): boolean {
  const hasLinkedIn = Boolean(
    lead.linkedinUrl || lead.linkedinCompanyUrl || lead.linkedinOwnerUrl
  );
  const hasSocial = Boolean(
    lead.facebook || lead.instagram || lead.youtube || lead.tiktok
  );
  const hasOwner = Boolean(lead.ownerName?.trim());
  return hasLinkedIn && hasSocial && hasOwner;
}

/** @deprecated use leadHasLinkedInSocialAndOwner */
export function leadHasLinkedInAndSocial(lead: SocialFields): boolean {
  return leadHasLinkedInSocialAndOwner(lead);
}

/** Race a promise against a timeout; on timeout return fallback (never block pipeline). */
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

export async function runLeadPipeline(params: SearchParams) {
  const requireSocial = params.requireSocialPresence !== false;
  const targetCount = params.locationScope === "country" ? 18 : 12;
  // Over-fetch harder — LinkedIn + social + owner is a stricter gate
  const fetchLimit = requireSocial
    ? params.locationScope === "country"
      ? 60
      : 42
    : targetCount;

  const location =
    params.customLocation?.trim() ||
    [params.city, params.state, params.zip, params.country]
      .filter(Boolean)
      .join(", ");

  const search = await prisma.search.create({
    data: {
      userId: params.userId,
      industry: params.industry,
      country: params.country,
      locationScope: params.locationScope,
      state: params.state,
      city: params.city,
      zip: params.zip,
      radius: params.radius,
    },
  });

  const places = await searchGooglePlaces({
    industry: params.industry,
    country: params.country,
    locationScope: params.locationScope,
    state: params.state,
    city: params.city,
    zip: params.zip,
    customLocation: params.customLocation,
    radius: params.radius,
    limit: fetchLimit,
  });

  const leads = [];
  let skippedNoSocial = 0;

  for (const place of places) {
    if (leads.length >= targetCount) break;

    // Prefer businesses with a website — owner details come from site pages
    if (requireSocial && !place.website) {
      skippedNoSocial += 1;
      continue;
    }

    // Trust Google Business Profile website — never wipe it because our
    // reachability check failed (many sites block bots / HEAD).
    const website = place.website;
    const [websiteReachable, websitePeople] = website
      ? await Promise.all([
          withTimeout(verifyWebsite(website), 6000, false),
          // Owner/team first so discovered owner name can drive LinkedIn lookup
          withTimeout(extractWebsitePeople(website), 9000, EMPTY_PEOPLE),
        ])
      : [false, EMPTY_PEOPLE];

    const placeForQualify = { ...place, website };
    const [yelp, houzz, nextdoor, linkedin, qualification, websiteSocial] =
      await Promise.all([
        matchYelpBusiness(place.name, location),
        withTimeout(matchHouzzBusiness(place.name, location), 8000, null),
        withTimeout(matchNextdoorBusiness(place.name, location), 5000, null),
        resolveLinkedIn(
          place.name,
          location,
          params.industry,
          websitePeople.owner?.name,
          website,
        ),
        qualifyLead(placeForQualify, params.industry, Boolean(website)),
        website
          ? withTimeout(discoverSocialFromWebsite(website), 8000, EMPTY_SOCIAL)
          : Promise.resolve(EMPTY_SOCIAL),
      ]);

    const facebook =
      websiteSocial.facebook ??
      (await withTimeout(searchFacebookPage(place.name), 8000, null));

    if (qualification.leadScore < 30) continue;

    // Prefer AI website score; only nudge slightly when we verified reachability
    const websiteQualityScore = website
      ? Math.min(
          100,
          Math.round(
            (qualification.websiteQualityScore ?? 40) +
              (websiteReachable ? 8 : 0),
          ),
        )
      : qualification.websiteQualityScore;

    // Reuse an existing lead when the same business is already in the pool
    const existingLead =
      (place.mapsUrl
        ? await prisma.lead.findFirst({
            where: { googleMapsLink: place.mapsUrl },
          })
        : null) ??
      (await prisma.lead.findFirst({
        where: {
          businessName: { equals: place.name, mode: "insensitive" },
          ...(place.address
            ? { address: { equals: place.address, mode: "insensitive" } }
            : {}),
        },
      }));

    const socialSnapshot = {
      linkedinUrl: linkedin.url ?? existingLead?.linkedinUrl,
      linkedinCompanyUrl:
        linkedin.companyUrl ?? existingLead?.linkedinCompanyUrl,
      linkedinOwnerUrl: linkedin.ownerUrl ?? existingLead?.linkedinOwnerUrl,
      facebook: facebook ?? existingLead?.facebook,
      instagram: websiteSocial.instagram ?? existingLead?.instagram,
      youtube: websiteSocial.youtube ?? existingLead?.youtube,
      tiktok: websiteSocial.tiktok ?? existingLead?.tiktok,
      ownerName: websitePeople.owner?.name ?? existingLead?.ownerName,
    };

    if (requireSocial && !leadHasLinkedInSocialAndOwner(socialSnapshot)) {
      skippedNoSocial += 1;
      continue;
    }

    if (existingLead) {
      const reused = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          searchId: search.id,
          industry: params.industry,
          country: params.country,
          state: params.state ?? existingLead.state,
          city: params.city ?? existingLead.city,
          zip: params.zip ?? existingLead.zip,
          phone: place.phone ?? existingLead.phone,
          website: website ?? existingLead.website,
          googleRating: place.rating ?? existingLead.googleRating,
          reviewCount: place.reviewCount ?? existingLead.reviewCount,
          ownerName: websitePeople.owner?.name ?? existingLead.ownerName,
          ownerTitle: websitePeople.owner?.role ?? existingLead.ownerTitle,
          ownerSourceUrl:
            websitePeople.owner?.sourceUrl ?? existingLead.ownerSourceUrl,
          ownerConfidence:
            websitePeople.owner?.confidence ?? existingLead.ownerConfidence,
          teamMembersJson: websitePeople.team.length
            ? JSON.stringify(websitePeople.team)
            : existingLead.teamMembersJson,
          email: websitePeople.email ?? existingLead.email,
          emailSourceUrl:
            websitePeople.emailSourceUrl ?? existingLead.emailSourceUrl,
          facebook: facebook ?? existingLead.facebook,
          instagram: websiteSocial.instagram ?? existingLead.instagram,
          youtube: websiteSocial.youtube ?? existingLead.youtube,
          tiktok: websiteSocial.tiktok ?? existingLead.tiktok,
          yelpUrl: yelp?.url ?? existingLead.yelpUrl,
          yelpRating: yelp?.rating ?? existingLead.yelpRating,
          yelpReviews: yelp?.reviewCount ?? existingLead.yelpReviews,
          houzzUrl: houzz?.url ?? existingLead.houzzUrl,
          houzzRating: houzz?.rating ?? existingLead.houzzRating,
          houzzReviews: houzz?.reviewCount ?? existingLead.houzzReviews,
          nextdoor: nextdoor?.url ?? existingLead.nextdoor,
          linkedinUrl: linkedin.url ?? existingLead.linkedinUrl,
          linkedinCompanyUrl:
            linkedin.companyUrl ?? existingLead.linkedinCompanyUrl,
          linkedinOwnerUrl: linkedin.ownerUrl ?? existingLead.linkedinOwnerUrl,
          linkedinConfidenceScore:
            linkedin.confidence || existingLead.linkedinConfidenceScore,
          linkedinOwnerConfidenceScore:
            linkedin.ownerConfidence || existingLead.linkedinOwnerConfidenceScore,
          linkedinType: linkedin.type ?? existingLead.linkedinType,
          // Always refresh AI / live qualification (not stale dummy buckets)
          leadScore: qualification.leadScore,
          serviceCategory: qualification.serviceCategory,
          revenueRangeEstimate: qualification.revenueRangeEstimate,
          websiteQualityScore,
          marketingOpportunityScore: qualification.marketingOpportunityScore,
          ppcOpportunityScore: qualification.ppcOpportunityScore,
          seoOpportunityScore: qualification.seoOpportunityScore,
          outreachAngle: qualification.outreachAngle,
          qualityTier: qualification.qualityTier,
        },
      });
      leads.push(reused);
      continue;
    }

    const lead = await prisma.lead.create({
      data: {
        businessName: place.name,
        ownerName: websitePeople.owner?.name ?? null,
        ownerTitle: websitePeople.owner?.role ?? null,
        ownerSourceUrl: websitePeople.owner?.sourceUrl ?? null,
        ownerConfidence: websitePeople.owner?.confidence ?? null,
        teamMembersJson: websitePeople.team.length
          ? JSON.stringify(websitePeople.team)
          : null,
        peopleEnrichedAt: website ? new Date() : null,
        email: websitePeople.email,
        emailSourceUrl: websitePeople.emailSourceUrl,
        facebook,
        instagram: websiteSocial.instagram,
        youtube: websiteSocial.youtube,
        tiktok: websiteSocial.tiktok,
        phone: place.phone,
        website: website ?? null,
        googleRating: place.rating,
        reviewCount: place.reviewCount,
        address: place.address,
        googleMapsLink: place.mapsUrl,
        leadScore: qualification.leadScore,
        serviceCategory: qualification.serviceCategory,
        revenueRangeEstimate: qualification.revenueRangeEstimate,
        websiteQualityScore,
        marketingOpportunityScore: qualification.marketingOpportunityScore,
        ppcOpportunityScore: qualification.ppcOpportunityScore,
        seoOpportunityScore: qualification.seoOpportunityScore,
        outreachAngle: qualification.outreachAngle,
        yelpUrl: yelp?.url ?? null,
        yelpRating: yelp?.rating ?? null,
        yelpReviews: yelp?.reviewCount ?? null,
        houzzUrl: houzz?.url ?? null,
        houzzRating: houzz?.rating ?? null,
        houzzReviews: houzz?.reviewCount ?? null,
        nextdoor: nextdoor?.url ?? null,
        linkedinUrl: linkedin.url,
        linkedinCompanyUrl: linkedin.companyUrl,
        linkedinOwnerUrl: linkedin.ownerUrl,
        linkedinConfidenceScore: linkedin.confidence || null,
        linkedinOwnerConfidenceScore: linkedin.ownerConfidence || null,
        linkedinType: linkedin.type,
        industry: params.industry,
        country: params.country,
        state: params.state,
        city: params.city ?? null,
        zip: params.zip ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
        qualityTier: qualification.qualityTier,
        verificationStatus: "verified",
        searchId: search.id,
      },
    });

    leads.push(lead);
  }

  await prisma.search.update({
    where: { id: search.id },
    data: { resultCount: leads.length },
  });

  return {
    search,
    leads,
    meta: {
      requireSocialPresence: requireSocial,
      skippedNoSocial,
      placesScanned: places.length,
    },
  };
}
