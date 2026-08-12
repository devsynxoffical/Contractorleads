import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { searchGooglePlaces } from "./google-places";
import { findLinkedInCompanyUrl } from "./linkedin";
import { finalizeLeadScore, qualifyLead } from "./qualification";
import {
  extractWebsitePeople,
  type WebsitePeopleResult,
} from "./website-people";
import { searchFacebookPage } from "./facebook";
import { scrapeWebsiteSocialPack } from "./website-social-pack";
import { auditWebsite, emptyWebsiteAudit } from "./website-audit";
import { matchYelpBusiness } from "./yelp";
import { mapPool } from "@/lib/utils/async-pool";
import type { PlaceResult } from "./google-places";
import { findExistingLead } from "./lead-identity";

const EMPTY_PEOPLE: WebsitePeopleResult = {
  owner: null,
  team: [],
  email: null,
  emailSourceUrl: null,
  pagesChecked: [],
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
  return Math.max(1, Math.min(1000, Math.floor(n as number)));
}

export async function runLeadPipeline(params: SearchParams) {
  // No hard LinkedIn/social filter — every qualified lead is kept. Leads with
  // LinkedIn + social are simply ranked first in the returned list.
  const targetCount = clampTarget(params.targetLeadCount);
  const isCountryWide = params.locationScope === "country";
  // Country-wide scrapes fan across metros, so give them a bigger fetch budget.
  const fetchLimit = isCountryWide
    ? Math.min(300, Math.max(targetCount * 3, targetCount + 40))
    : Math.min(150, Math.max(targetCount * 2, targetCount + 15));

  const preferRules = true; // keep volume searches fast
  // Higher concurrency — enrichment is I/O bound
  const placeConcurrency =
    targetCount >= 250
      ? 22
      : targetCount >= 100
        ? 16
        : targetCount >= 50
          ? 12
          : 8;

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
  let scanned = 0;

  // Prefer businesses with websites so the strongest candidates fill first.
  const ordered = [
    ...places.filter((p) => p.website),
    ...places.filter((p) => !p.website),
  ];

  await mapPool(ordered, placeConcurrency, async (place) => {
    if (leads.length >= targetCount) return;

    scanned += 1;

    const lead = await enrichAndPersistPlace({
      place,
      params,
      searchId: search.id,
      location,
      preferRules,
    });

    if (lead === "skipped-score") return;
    if (leads.length >= targetCount) return;
    leads.push(lead);
  });

  // LinkedIn + social leads first, then the rest — each group by score.
  const finalLeads = leads.slice(0, targetCount).sort((a, b) => {
    const aRank = leadHasLinkedInAndSocial(a) ? 0 : 1;
    const bRank = leadHasLinkedInAndSocial(b) ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return (
      b.leadScore - a.leadScore ||
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  });

  await prisma.search.update({
    where: { id: search.id },
    data: { resultCount: finalLeads.length },
  });

  return {
    search,
    leads: finalLeads,
    meta: {
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
  preferRules: boolean;
}): Promise<
  Awaited<ReturnType<typeof prisma.lead.create>> | "skipped-score"
> {
  const { place, params, searchId, location, preferRules } = opts;

  const website = place.website;
  const emptyPack = {
    linkedinCompany: null as string | null,
    linkedinOwner: null as string | null,
    facebook: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
    tiktok: null as string | null,
    pagesChecked: [] as string[],
    audit: emptyWebsiteAudit(),
  };

  const { discoverSocialProfiles } = await import("./web-search");

  // Homepage-first scrape (skips extra pages when already complete)
  let packTimedOut = false;
  let pack = website
    ? await withTimeout(scrapeWebsiteSocialPack(website), 8000, null)
    : null;
  if (website && !pack) {
    packTimedOut = true;
    // Focused homepage audit so we don't invent "dead site" scores on timeout
    const focusedAudit = await withTimeout(
      auditWebsite(website, { timeoutMs: 10000 }),
      11000,
      emptyWebsiteAudit(),
    );
    pack = {
      ...emptyPack,
      audit: focusedAudit,
    };
  }
  if (!pack) pack = emptyPack;

  const packHasLi = Boolean(pack.linkedinCompany || pack.linkedinOwner);
  const packHasSocial = Boolean(
    pack.facebook || pack.instagram || pack.youtube || pack.tiktok,
  );

  // Automatic social discovery whenever website pack is incomplete
  const fromWeb =
    !packHasLi || !packHasSocial
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

  // Automatic light enrichment (short timeouts — no manual Fetch needed)
  const [companyLi, qualification, facebookPage, websitePeople, yelp] =
    await Promise.all([
      linkedinHint
        ? Promise.resolve({
            url: linkedinHint.includes("/in/") ? null : linkedinHint,
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
            3000,
            { url: null, confidence: 0, source: null },
          ),
      qualifyLead({ ...place, website }, params.industry, Boolean(website), {
        preferRules,
        timeoutMs: preferRules ? 1 : 8000,
        websiteAudit: pack.audit,
        // Timeout without a confirmed HTTP failure → don't claim the site is dead
        treatUnreachableAsPending:
          packTimedOut && !pack.audit.reachable,
      }),
      !(pack.facebook || fromWeb.facebook)
        ? withTimeout(searchFacebookPage(place.name), 2500, null)
        : Promise.resolve(null),
      website
        ? withTimeout(extractWebsitePeople(website), 9000, EMPTY_PEOPLE)
        : Promise.resolve(EMPTY_PEOPLE),
      withTimeout(matchYelpBusiness(place.name, location), 2500, null),
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

  const websiteOwnerName = websitePeople.owner?.name ?? null;
  const { discoverOwnerFromSearch, EMPTY_OWNER_DISCOVERY } = await import(
    "./owner-discovery"
  );
  const ownerFromSearch = websiteOwnerName
    ? EMPTY_OWNER_DISCOVERY
    : await withTimeout(
        discoverOwnerFromSearch(place.name, location),
        9000,
        EMPTY_OWNER_DISCOVERY,
      );

  const resolvedOwner =
    ownerUrl || ownerFromSearch.ownerLinkedInUrl || null;
  const primaryLinkedIn = companyUrl || resolvedOwner || fromWeb.linkedin;
  const ownerName = websiteOwnerName ?? ownerFromSearch.ownerName ?? null;
  const ownerTitle =
    websitePeople.owner?.role ?? ownerFromSearch.ownerRole ?? null;
  const ownerSourceUrl =
    websitePeople.owner?.sourceUrl ?? ownerFromSearch.sourceUrl ?? null;
  const ownerConfidence =
    websitePeople.owner?.confidence ?? ownerFromSearch.confidence ?? null;
  const ownerLinkedInFromSearch =
    Boolean(ownerFromSearch.ownerLinkedInUrl) && !ownerUrl;
  const ownerLinkedInConfidence = resolvedOwner
    ? ownerLinkedInFromSearch
      ? Math.max(ownerFromSearch.confidence, 90)
      : 96
    : null;

  const facebook =
    pack.facebook || facebookPage || fromWeb.facebook || null;
  const instagram = pack.instagram || fromWeb.instagram || null;

  if (qualification.leadScore < 25) return "skipped-score";

  const websiteQualityScore = qualification.websiteQualityScore;

  // Match against the pool by the strongest identity signals so re-scrapes
  // update the existing row instead of creating a duplicate.
  const existingLead = await findExistingLead({
    name: place.name,
    address: place.address,
    phone: place.phone,
    website: place.website,
    mapsUrl: place.mapsUrl,
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

  const ownerNameFinal = ownerName ?? existingLead?.ownerName ?? null;
  const emailFinal = websitePeople.email ?? existingLead?.email ?? null;
  const websiteFinal = website ?? existingLead?.website ?? null;
  const hasSocial = Boolean(
    socialSnapshot.facebook ||
      socialSnapshot.instagram ||
      socialSnapshot.youtube ||
      socialSnapshot.tiktok,
  );
  const hasLinkedIn = Boolean(
    socialSnapshot.linkedinUrl ||
      socialSnapshot.linkedinCompanyUrl ||
      socialSnapshot.linkedinOwnerUrl,
  );

  const scored = finalizeLeadScore(qualification.leadScore, {
    hasWebsite: Boolean(websiteFinal),
    hasEmail: Boolean(emailFinal),
    hasOwner: Boolean(ownerNameFinal),
    hasLinkedIn,
    hasSocial,
    hasPhone: Boolean(place.phone ?? existingLead?.phone),
  });

  if (scored.leadScore < 25) return "skipped-score";

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
    website: websiteFinal,
    googleRating: place.rating ?? existingLead?.googleRating,
    reviewCount: place.reviewCount ?? existingLead?.reviewCount,
    ownerName: ownerNameFinal,
    ownerTitle: ownerTitle ?? existingLead?.ownerTitle,
    ownerSourceUrl: ownerSourceUrl ?? existingLead?.ownerSourceUrl,
    ownerConfidence: ownerConfidence ?? existingLead?.ownerConfidence,
    teamMembersJson: websitePeople.team.length
      ? JSON.stringify(websitePeople.team)
      : existingLead?.teamMembersJson,
    email: emailFinal,
    emailSourceUrl:
      websitePeople.emailSourceUrl ?? existingLead?.emailSourceUrl,
    facebook: facebook ?? existingLead?.facebook,
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
    yelpUrl: yelp?.url ?? existingLead?.yelpUrl,
    yelpRating: yelp?.rating ?? existingLead?.yelpRating,
    yelpReviews: yelp?.reviewCount ?? existingLead?.yelpReviews,
    houzzUrl: existingLead?.houzzUrl ?? null,
    houzzRating: existingLead?.houzzRating ?? null,
    houzzReviews: existingLead?.houzzReviews ?? null,
    nextdoor: existingLead?.nextdoor ?? null,
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    linkedinConfidenceScore:
      companyLi.confidence || existingLead?.linkedinConfidenceScore,
    linkedinOwnerConfidenceScore:
      ownerLinkedInConfidence ?? existingLead?.linkedinOwnerConfidenceScore,
    linkedinType: linkedinType ?? existingLead?.linkedinType,
    leadScore: scored.leadScore,
    serviceCategory: qualification.serviceCategory,
    revenueRangeEstimate: qualification.revenueRangeEstimate || null,
    websiteQualityScore,
    marketingOpportunityScore: qualification.marketingOpportunityScore,
    ppcOpportunityScore: qualification.ppcOpportunityScore,
    seoOpportunityScore: qualification.seoOpportunityScore,
    outreachAngle: qualification.outreachAngle,
    qualityTier: scored.qualityTier,
    peopleEnrichedAt:
      websitePeople.owner || ownerFromSearch.ownerName || websitePeople.email
        ? new Date()
        : existingLead?.peopleEnrichedAt,
    socialEnrichedAt: new Date(),
    // Always refresh coords so Lead Map stays accurate for reused pool leads
    latitude: place.latitude ?? existingLead?.latitude ?? undefined,
    longitude: place.longitude ?? existingLead?.longitude ?? undefined,
    address: place.address || existingLead?.address,
    googleMapsLink: place.mapsUrl || existingLead?.googleMapsLink,
  };

  if (existingLead) {
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: sharedData,
    });
  }

  try {
    return await prisma.lead.create({
      data: {
        businessName: place.name,
      ownerName: ownerNameFinal,
      ownerTitle,
      ownerSourceUrl: ownerSourceUrl,
      ownerConfidence: ownerConfidence,
      teamMembersJson: websitePeople.team.length
        ? JSON.stringify(websitePeople.team)
        : null,
      peopleEnrichedAt:
        websitePeople.owner || ownerFromSearch.ownerName || websitePeople.email
          ? new Date()
          : null,
      email: emailFinal,
      emailSourceUrl: websitePeople.emailSourceUrl,
      facebook,
      instagram,
      youtube: pack.youtube,
      tiktok: pack.tiktok,
      phone: place.phone,
      website: websiteFinal,
      googleRating: place.rating,
      reviewCount: place.reviewCount,
      address: place.address,
      googleMapsLink: place.mapsUrl,
      leadScore: scored.leadScore,
      serviceCategory: qualification.serviceCategory,
      revenueRangeEstimate: qualification.revenueRangeEstimate || null,
      websiteQualityScore,
      marketingOpportunityScore: qualification.marketingOpportunityScore,
      ppcOpportunityScore: qualification.ppcOpportunityScore,
      seoOpportunityScore: qualification.seoOpportunityScore,
      outreachAngle: qualification.outreachAngle,
      yelpUrl: yelp?.url ?? null,
      yelpRating: yelp?.rating ?? null,
      yelpReviews: yelp?.reviewCount ?? null,
      houzzUrl: null,
      houzzRating: null,
      houzzReviews: null,
      nextdoor: null,
      linkedinUrl: primaryLinkedIn,
      linkedinCompanyUrl: companyUrl,
      linkedinOwnerUrl: resolvedOwner,
      linkedinConfidenceScore: companyLi.confidence || null,
      linkedinOwnerConfidenceScore: ownerLinkedInConfidence,
      linkedinType,
      socialEnrichedAt: new Date(),
      qualityTier: scored.qualityTier,
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
  } catch (err) {
    // Lost a create race (duplicate maps link or phone) — merge into the row
    // another worker just created instead of leaving a duplicate.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winner = await findExistingLead({
        name: place.name,
        address: place.address,
        phone: place.phone,
        website: place.website,
        mapsUrl: place.mapsUrl,
      });
      if (winner) {
        return prisma.lead.update({
          where: { id: winner.id },
          data: sharedData,
        });
      }
    }
    throw err;
  }
}
