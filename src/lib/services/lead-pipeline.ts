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
import { mapPool } from "@/lib/utils/async-pool";
import type { PlaceResult } from "./google-places";

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

const EMPTY_LINKEDIN = {
  url: null as string | null,
  companyUrl: null as string | null,
  ownerUrl: null as string | null,
  type: "none",
  confidence: 0,
  ownerConfidence: 0,
  companySource: null as null,
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
  /** Default false — LinkedIn + social + website owner filter. */
  requireSocialPresence?: boolean;
  /** How many leads the client asked for (10–1000). */
  targetLeadCount?: number;
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
    lead.linkedinUrl || lead.linkedinCompanyUrl || lead.linkedinOwnerUrl,
  );
  const hasSocial = Boolean(
    lead.facebook || lead.instagram || lead.youtube || lead.tiktok,
  );
  const hasOwner = Boolean(lead.ownerName?.trim());
  return hasLinkedIn && hasSocial && hasOwner;
}

/** @deprecated use leadHasLinkedInSocialAndOwner */
export function leadHasLinkedInAndSocial(lead: SocialFields): boolean {
  return leadHasLinkedInSocialAndOwner(lead);
}

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

function clampTarget(n: number | undefined) {
  if (!Number.isFinite(n as number)) return 50;
  return Math.max(10, Math.min(1000, Math.floor(n as number)));
}

export async function runLeadPipeline(params: SearchParams) {
  const requireSocial = params.requireSocialPresence === true;
  const targetCount = clampTarget(params.targetLeadCount);
  // Over-fetch Places: social filter rejects many candidates
  const fetchLimit = requireSocial
    ? Math.min(1200, Math.max(targetCount * 5, targetCount + 40))
    : Math.min(1200, Math.max(targetCount * 2, targetCount + 20));

  const preferRules = targetCount >= 80 || requireSocial;
  const placeConcurrency = targetCount >= 250 ? 14 : targetCount >= 80 ? 10 : 6;

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

  const leads: Awaited<ReturnType<typeof prisma.lead.create>>[] = [];
  let skippedNoSocial = 0;
  let scanned = 0;

  // Prefer businesses with websites when social filter is on
  const ordered = requireSocial
    ? [
        ...places.filter((p) => p.website),
        ...places.filter((p) => !p.website),
      ]
    : places;

  await mapPool(ordered, placeConcurrency, async (place) => {
    if (leads.length >= targetCount) return;

    scanned += 1;

    if (requireSocial && !place.website) {
      skippedNoSocial += 1;
      return;
    }

    const lead = await enrichAndPersistPlace({
      place,
      params,
      searchId: search.id,
      location,
      requireSocial,
      preferRules,
    });

    if (lead === "skipped-social") {
      skippedNoSocial += 1;
      return;
    }
    if (lead === "skipped-score") return;
    if (leads.length >= targetCount) return;
    leads.push(lead);
  });

  const finalLeads = leads.slice(0, targetCount);

  await prisma.search.update({
    where: { id: search.id },
    data: { resultCount: finalLeads.length },
  });

  return {
    search,
    leads: finalLeads,
    meta: {
      requireSocialPresence: requireSocial,
      skippedNoSocial,
      placesScanned: scanned || places.length,
      placesFetched: places.length,
      targetLeadCount: targetCount,
    },
  };
}

async function enrichAndPersistPlace(opts: {
  place: PlaceResult;
  params: SearchParams;
  searchId: string;
  location: string;
  requireSocial: boolean;
  preferRules: boolean;
}): Promise<
  | Awaited<ReturnType<typeof prisma.lead.create>>
  | "skipped-social"
  | "skipped-score"
> {
  const { place, params, searchId, location, requireSocial, preferRules } =
    opts;

  const website = place.website;
  const [websiteReachable, websitePeople] = website
    ? await Promise.all([
        withTimeout(verifyWebsite(website), 4000, false),
        withTimeout(extractWebsitePeople(website), 7000, EMPTY_PEOPLE),
      ])
    : [false, EMPTY_PEOPLE];

  const placeForQualify = { ...place, website };
  const [yelp, houzz, nextdoor, linkedin, qualification, websiteSocial] =
    await Promise.all([
      withTimeout(matchYelpBusiness(place.name, location), 6000, null),
      withTimeout(matchHouzzBusiness(place.name, location), 5000, null),
      withTimeout(matchNextdoorBusiness(place.name, location), 4000, null),
      withTimeout(
        resolveLinkedIn(
          place.name,
          location,
          params.industry,
          websitePeople.owner?.name,
          website,
        ),
        requireSocial ? 12000 : 8000,
        EMPTY_LINKEDIN,
      ),
      qualifyLead(placeForQualify, params.industry, Boolean(website), {
        preferRules,
        timeoutMs: preferRules ? 1 : 6000,
      }),
      website
        ? withTimeout(discoverSocialFromWebsite(website), 6000, EMPTY_SOCIAL)
        : Promise.resolve(EMPTY_SOCIAL),
    ]);

  let facebook = websiteSocial.facebook;
  if (!facebook && requireSocial) {
    facebook = await withTimeout(searchFacebookPage(place.name), 5000, null);
  }

  if (qualification.leadScore < 25) return "skipped-score";

  const websiteQualityScore = website
    ? Math.min(
        100,
        Math.round(
          (qualification.websiteQualityScore ?? 40) +
            (websiteReachable ? 8 : 0),
        ),
      )
    : qualification.websiteQualityScore;

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
    return "skipped-social";
  }

  const sharedData = {
    searchId,
    industry: params.industry,
    country: params.country,
    state: params.state ?? existingLead?.state,
    city: params.city ?? existingLead?.city,
    zip: params.zip ?? existingLead?.zip,
    phone: place.phone ?? existingLead?.phone,
    website: website ?? existingLead?.website,
    googleRating: place.rating ?? existingLead?.googleRating,
    reviewCount: place.reviewCount ?? existingLead?.reviewCount,
    ownerName: websitePeople.owner?.name ?? existingLead?.ownerName,
    ownerTitle: websitePeople.owner?.role ?? existingLead?.ownerTitle,
    ownerSourceUrl:
      websitePeople.owner?.sourceUrl ?? existingLead?.ownerSourceUrl,
    ownerConfidence:
      websitePeople.owner?.confidence ?? existingLead?.ownerConfidence,
    teamMembersJson: websitePeople.team.length
      ? JSON.stringify(websitePeople.team)
      : existingLead?.teamMembersJson,
    email: websitePeople.email ?? existingLead?.email,
    emailSourceUrl:
      websitePeople.emailSourceUrl ?? existingLead?.emailSourceUrl,
    facebook: facebook ?? existingLead?.facebook,
    instagram: websiteSocial.instagram ?? existingLead?.instagram,
    youtube: websiteSocial.youtube ?? existingLead?.youtube,
    tiktok: websiteSocial.tiktok ?? existingLead?.tiktok,
    yelpUrl: yelp?.url ?? existingLead?.yelpUrl,
    yelpRating: yelp?.rating ?? existingLead?.yelpRating,
    yelpReviews: yelp?.reviewCount ?? existingLead?.yelpReviews,
    houzzUrl: houzz?.url ?? existingLead?.houzzUrl,
    houzzRating: houzz?.rating ?? existingLead?.houzzRating,
    houzzReviews: houzz?.reviewCount ?? existingLead?.houzzReviews,
    nextdoor: nextdoor?.url ?? existingLead?.nextdoor,
    linkedinUrl: linkedin.url ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl:
      linkedin.companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: linkedin.ownerUrl ?? existingLead?.linkedinOwnerUrl,
    linkedinConfidenceScore:
      linkedin.confidence || existingLead?.linkedinConfidenceScore,
    linkedinOwnerConfidenceScore:
      linkedin.ownerConfidence || existingLead?.linkedinOwnerConfidenceScore,
    linkedinType: linkedin.type ?? existingLead?.linkedinType,
    leadScore: qualification.leadScore,
    serviceCategory: qualification.serviceCategory,
    revenueRangeEstimate: qualification.revenueRangeEstimate,
    websiteQualityScore,
    marketingOpportunityScore: qualification.marketingOpportunityScore,
    ppcOpportunityScore: qualification.ppcOpportunityScore,
    seoOpportunityScore: qualification.seoOpportunityScore,
    outreachAngle: qualification.outreachAngle,
    qualityTier: qualification.qualityTier,
  };

  if (existingLead) {
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: sharedData,
    });
  }

  return prisma.lead.create({
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
      searchId,
    },
  });
}
