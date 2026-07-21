import { prisma } from "@/lib/prisma";
import { searchGooglePlaces } from "./google-places";
import { findLinkedInCompanyUrl } from "./linkedin";
import { qualifyLead } from "./qualification";
import { searchFacebookPage } from "./facebook";
import { scrapeWebsiteSocialPack } from "./website-social-pack";
import { mapPool } from "@/lib/utils/async-pool";
import type { PlaceResult } from "./google-places";

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
  email?: string | null;
};

/** LinkedIn + at least one consumer social (FB/IG/YT/TikTok). */
export function leadHasLinkedInAndSocial(lead: SocialFields): boolean {
  const hasLinkedIn = Boolean(
    lead.linkedinUrl || lead.linkedinCompanyUrl || lead.linkedinOwnerUrl,
  );
  const hasSocial = Boolean(
    lead.facebook || lead.instagram || lead.youtube || lead.tiktok,
  );
  return hasLinkedIn && hasSocial;
}

/** @deprecated alias — filter no longer requires owner/email */
export function leadHasLinkedInSocialAndOwner(lead: SocialFields): boolean {
  return leadHasLinkedInAndSocial(lead);
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
  // Over-fetch Places heavily when social filter is on (many candidates lack profiles)
  const fetchLimit = requireSocial
    ? Math.min(1200, Math.max(targetCount * 12, targetCount + 80))
    : Math.min(1200, Math.max(targetCount * 2, targetCount + 20));

  const preferRules = true; // keep volume searches fast
  // Higher concurrency — enrichment is I/O bound
  const placeConcurrency = requireSocial
    ? targetCount >= 100
      ? 20
      : 14
    : targetCount >= 250
      ? 22
      : targetCount >= 80
        ? 16
        : 10;

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
  const emptyPack = {
    linkedinCompany: null as string | null,
    linkedinOwner: null as string | null,
    facebook: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
    tiktok: null as string | null,
    pagesChecked: [] as string[],
  };

  const { discoverSocialProfiles } = await import("./web-search");

  // Homepage-first scrape (skips extra pages when already complete)
  const pack = website
    ? await withTimeout(scrapeWebsiteSocialPack(website), 4500, emptyPack)
    : emptyPack;

  const packHasLi = Boolean(pack.linkedinCompany || pack.linkedinOwner);
  const packHasSocial = Boolean(
    pack.facebook || pack.instagram || pack.youtube || pack.tiktok,
  );

  // Only hit Brave when the website didn't already give LinkedIn + social
  const fromWeb =
    requireSocial && (!packHasLi || !packHasSocial)
      ? await withTimeout(discoverSocialProfiles(place.name, location), 4500, {
          linkedin: null,
          facebook: null,
          instagram: null,
        })
      : {
          linkedin: null as string | null,
          facebook: null as string | null,
          instagram: null as string | null,
        };

  const linkedinHint = pack.linkedinCompany || pack.linkedinOwner || fromWeb.linkedin;
  const socialHint =
    pack.facebook ||
    pack.instagram ||
    pack.youtube ||
    pack.tiktok ||
    fromWeb.facebook ||
    fromWeb.instagram;

  // Fail fast before slow secondary APIs when filter can't be satisfied
  if (requireSocial && (!linkedinHint || !socialHint)) {
    return "skipped-social";
  }

  // Fast path: skip Yelp/Houzz/Nextdoor/people/verify — they dominate latency
  const [companyLi, qualification, facebookPage] = await Promise.all([
    linkedinHint
      ? Promise.resolve({
          url: linkedinHint.includes("/in/")
            ? null
            : linkedinHint,
          confidence: pack.linkedinCompany || fromWeb.linkedin ? 96 : 90,
          source: (pack.linkedinCompany
            ? "website"
            : fromWeb.linkedin
              ? "web"
              : "website") as "website" | "web" | null,
        })
      : withTimeout(
          findLinkedInCompanyUrl(
            place.name,
            location,
            params.industry,
            website,
            {
              websiteCompanyUrl: null,
              skipWebsiteScrape: true,
              skipWebSearch: true,
            },
          ),
          4000,
          { url: null, confidence: 0, source: null },
        ),
    qualifyLead({ ...place, website }, params.industry, Boolean(website), {
      preferRules,
      timeoutMs: 1,
    }),
    !(pack.facebook || fromWeb.facebook)
      ? withTimeout(searchFacebookPage(place.name), 2500, null)
      : Promise.resolve(null),
  ]);

  const companyUrl =
    (companyLi.url && !companyLi.url.includes("/in/")
      ? companyLi.url
      : null) ||
    pack.linkedinCompany ||
    (fromWeb.linkedin && !fromWeb.linkedin.includes("/in/")
      ? fromWeb.linkedin
      : null);
  const ownerUrl =
    pack.linkedinOwner ||
    (fromWeb.linkedin?.includes("/in/") ? fromWeb.linkedin : null);
  const primaryLinkedIn = companyUrl || ownerUrl || fromWeb.linkedin;
  const resolvedOwner = ownerUrl;

  const facebook =
    pack.facebook || facebookPage || fromWeb.facebook || null;
  const instagram = pack.instagram || fromWeb.instagram || null;

  if (qualification.leadScore < 25) return "skipped-score";

  const websiteQualityScore = website
    ? Math.min(100, Math.round(qualification.websiteQualityScore ?? 40))
    : qualification.websiteQualityScore;

  // Single lookup — maps URL first, name+address only if needed
  const existingLead = place.mapsUrl
    ? await prisma.lead.findFirst({
        where: { googleMapsLink: place.mapsUrl },
      })
    : await prisma.lead.findFirst({
        where: {
          businessName: { equals: place.name, mode: "insensitive" },
          ...(place.address
            ? { address: { equals: place.address, mode: "insensitive" } }
            : {}),
        },
      });

  const socialSnapshot = {
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    facebook: facebook ?? existingLead?.facebook,
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
  };

  if (requireSocial && !leadHasLinkedInAndSocial(socialSnapshot)) {
    return "skipped-social";
  }

  const linkedinType = companyUrl
    ? "company"
    : resolvedOwner
      ? "owner"
      : primaryLinkedIn
        ? "company"
        : "none";

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
    ownerName: existingLead?.ownerName ?? null,
    ownerTitle: existingLead?.ownerTitle ?? null,
    ownerSourceUrl: existingLead?.ownerSourceUrl ?? null,
    ownerConfidence: existingLead?.ownerConfidence ?? null,
    teamMembersJson: existingLead?.teamMembersJson ?? null,
    email: existingLead?.email ?? null,
    emailSourceUrl: existingLead?.emailSourceUrl ?? null,
    facebook: facebook ?? existingLead?.facebook,
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
    yelpUrl: existingLead?.yelpUrl ?? null,
    yelpRating: existingLead?.yelpRating ?? null,
    yelpReviews: existingLead?.yelpReviews ?? null,
    houzzUrl: existingLead?.houzzUrl ?? null,
    houzzRating: existingLead?.houzzRating ?? null,
    houzzReviews: existingLead?.houzzReviews ?? null,
    nextdoor: existingLead?.nextdoor ?? null,
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    linkedinConfidenceScore:
      companyLi.confidence || existingLead?.linkedinConfidenceScore,
    linkedinOwnerConfidenceScore: resolvedOwner
      ? 96
      : existingLead?.linkedinOwnerConfidenceScore,
    linkedinType: linkedinType ?? existingLead?.linkedinType,
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
      ownerName: null,
      ownerTitle: null,
      ownerSourceUrl: null,
      ownerConfidence: null,
      teamMembersJson: null,
      peopleEnrichedAt: null,
      email: null,
      emailSourceUrl: null,
      facebook,
      instagram,
      youtube: pack.youtube,
      tiktok: pack.tiktok,
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
      yelpUrl: null,
      yelpRating: null,
      yelpReviews: null,
      houzzUrl: null,
      houzzRating: null,
      houzzReviews: null,
      nextdoor: null,
      linkedinUrl: primaryLinkedIn,
      linkedinCompanyUrl: companyUrl,
      linkedinOwnerUrl: resolvedOwner,
      linkedinConfidenceScore: companyLi.confidence || null,
      linkedinOwnerConfidenceScore: resolvedOwner ? 96 : null,
      linkedinType,
      socialEnrichedAt: new Date(),
      qualityTier: qualification.qualityTier,
      searchId,
      industry: params.industry,
      country: params.country,
      state: params.state,
      city: params.city,
      zip: params.zip,
      latitude: place.latitude,
      longitude: place.longitude,
      verificationStatus: "verified",
    },
  });
}
