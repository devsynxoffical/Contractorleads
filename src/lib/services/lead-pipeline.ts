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
import {
  scrapeWebsiteSocialPack,
  EMPTY_WEBSITE_SOCIAL_PACK,
} from "./website-social-pack";
import { auditWebsite, emptyWebsiteAudit } from "./website-audit";
import { matchYelpBusiness } from "./yelp";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { mapPool } from "@/lib/utils/async-pool";
import type { PlaceResult } from "./google-places";
import { findExistingLead } from "./lead-identity";
import { plausiblePersonName } from "./owner-discovery";

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
  /** Fast contacts mode: extracts core business, owner, phone, email, location without slow external social scrapers */
  fastContactsOnly?: boolean;
  /** Optional callback fired incrementally as each lead is enriched & persisted */
  onLeadDiscovered?: (
    lead: Awaited<ReturnType<typeof prisma.lead.create>>,
    progress: {
      current: number;
      target: number;
      placeName: string;
      scanned: number;
    },
  ) => void | Promise<void>;
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

function parseAddressComponents(
  rawAddress?: string | null,
  fallbackState?: string | null,
  fallbackCity?: string | null,
  fallbackZip?: string | null,
) {
  let city = fallbackCity || null;
  let state = fallbackState || null;
  let zip = fallbackZip || null;

  if (!rawAddress) return { city, state, zip };

  const parts = rawAddress.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    const stateZipCandidate = parts[parts.length - 2];
    if (!state && stateZipCandidate) {
      const match = stateZipCandidate.match(/^([A-Za-z\s]+?)\s+([A-Z0-9-]+)$/);
      if (match) {
        state = state || match[1].trim();
        zip = zip || match[2].trim();
      } else if (/^[A-Z]{2}$/i.test(stateZipCandidate.trim())) {
        state = state || stateZipCandidate.trim().toUpperCase();
      }
    }
    if (!city && parts.length >= 3) {
      const cityCandidate = parts[parts.length - 3];
      if (cityCandidate && !/\d{2,}/.test(cityCandidate)) {
        city = cityCandidate;
      }
    }
  }

  return { city, state, zip };
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
  const fastContacts = Boolean(params.fastContactsOnly);

  // Allow up to 1000 places so requests for 400-500 leads are satisfied
  const fetchLimit = isCountryWide
    ? Math.min(1000, Math.max(targetCount * 2, targetCount + 60))
    : Math.min(1000, Math.max(targetCount * 2, targetCount + 30));

  const preferRules = true; // keep volume searches fast
  // Higher concurrency — fast contacts mode is lightweight, full mode is I/O bound
  const placeConcurrency = fastContacts
    ? targetCount >= 200
      ? 28
      : 18
    : targetCount >= 250
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

  const leads: Awaited<ReturnType<typeof prisma.lead.create>>[] = [];
  let scanned = 0;
  let totalPlacesFetched = 0;

  // Real-time progressive enrichment pool: processes places as they arrive from queries
  const pendingEnrichments: Promise<void>[] = [];
  const activeEnriching = new Set<Promise<void>>();

  async function enqueuePlaces(incoming: PlaceResult[]) {
    totalPlacesFetched += incoming.length;
    // Prefer businesses with websites
    const sorted = [
      ...incoming.filter((p) => p.website),
      ...incoming.filter((p) => !p.website),
    ];

    for (const place of sorted) {
      if (leads.length >= targetCount) break;

      // Throttle concurrent enrichment tasks to configured concurrency
      while (activeEnriching.size >= placeConcurrency && leads.length < targetCount) {
        await Promise.race(Array.from(activeEnriching));
      }

      if (leads.length >= targetCount) break;

      scanned += 1;
      const taskPromise = (async () => {
        try {
          const lead = await enrichAndPersistPlace({
            place,
            params,
            searchId: search.id,
            location,
            preferRules,
            fastContacts,
          });

          if (lead === "skipped-score") return;
          if (leads.length >= targetCount) return;

          leads.push(lead);

          if (params.onLeadDiscovered) {
            try {
              await params.onLeadDiscovered(lead, {
                current: leads.length,
                target: targetCount,
                placeName: place.name,
                scanned,
              });
            } catch {
              /* ignore callback errors */
            }
          }
        } catch {
          /* ignore worker errors */
        }
      })();

      activeEnriching.add(taskPromise);
      void taskPromise.finally(() => {
        activeEnriching.delete(taskPromise);
      });
      pendingEnrichments.push(taskPromise);
    }
  }

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
    onPlacesBatch: async (batch) => {
      await enqueuePlaces(batch);
    },
    shouldStop: () => leads.length >= targetCount,
  });

  // If any places were returned synchronously/fallback without batch callback
  if (totalPlacesFetched === 0 && places.length > 0) {
    await enqueuePlaces(places);
  }

  // Wait for all in-flight enrichment tasks to complete
  await Promise.all(pendingEnrichments);

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
  fastContacts?: boolean;
}): Promise<
  Awaited<ReturnType<typeof prisma.lead.create>> | "skipped-score"
> {
  const { place, params, searchId, location, preferRules, fastContacts } = opts;

  const website = place.website;
  const emptyPack = EMPTY_WEBSITE_SOCIAL_PACK;

  const addr = parseAddressComponents(
    place.address,
    params.state,
    params.city,
    params.zip,
  );

  if (fastContacts) {
    // Ultra-fast direct contact mode: Extracts owner/team and public email from website in <2.5s
    // Skips slow external social network and directory crawlers
    let websitePeople = EMPTY_PEOPLE;
    if (website) {
      websitePeople = await withTimeout(
        extractWebsitePeople(website, { budgetMs: 2500 }),
        3000,
        EMPTY_PEOPLE,
      );
    }

    const qualification = await qualifyLead(
      { ...place, website },
      params.industry,
      Boolean(website),
      {
        preferRules: true,
        timeoutMs: 1,
      },
    );

    const existingOwner =
      existingLead?.ownerName &&
      plausiblePersonName(existingLead.ownerName, place.name)
        ? existingLead.ownerName
        : null;

    const ownerCandidate =
      websitePeople.owner?.name &&
      plausiblePersonName(websitePeople.owner.name, place.name)
        ? websitePeople.owner.name
        : null;

    const ownerNameFinal = ownerCandidate ?? existingOwner;
    const ownerTitle = ownerCandidate
      ? websitePeople.owner?.role ?? null
      : existingOwner
        ? existingLead?.ownerTitle ?? null
        : null;
    const ownerSourceUrl = ownerCandidate
      ? websitePeople.owner?.sourceUrl ?? null
      : existingOwner
        ? existingLead?.ownerSourceUrl ?? null
        : null;
    const ownerConfidence = ownerCandidate
      ? websitePeople.owner?.confidence ?? 90
      : existingOwner
        ? existingLead?.ownerConfidence ?? null
        : null;
    const emailFinal = websitePeople.email ?? existingLead?.email ?? null;

    const scored = finalizeLeadScore(qualification.leadScore, {
      hasWebsite: Boolean(website || existingLead?.website),
      hasEmail: Boolean(emailFinal),
      hasOwner: Boolean(ownerNameFinal),
      hasLinkedIn: Boolean(existingLead?.linkedinUrl),
      hasSocial: Boolean(existingLead?.facebook || existingLead?.instagram),
      hasPhone: Boolean(place.phone ?? existingLead?.phone),
    });

    if (scored.leadScore < 20) return "skipped-score";

    const sharedData = {
      searchId,
      industry: params.industry,
      country: params.country,
      state: addr.state ?? existingLead?.state,
      city: addr.city ?? existingLead?.city,
      zip: addr.zip ?? existingLead?.zip,
      phone: place.phone ?? existingLead?.phone,
      website: website ?? existingLead?.website,
      googleRating: place.rating ?? existingLead?.googleRating,
      reviewCount: place.reviewCount ?? existingLead?.reviewCount,
      ownerName: ownerNameFinal,
      ownerTitle: ownerTitle,
      ownerSourceUrl: ownerSourceUrl,
      ownerConfidence: ownerConfidence,
      teamMembersJson: websitePeople.team.length
        ? JSON.stringify(websitePeople.team)
        : existingLead?.teamMembersJson,
      email: emailFinal,
      emailSourceUrl:
        websitePeople.emailSourceUrl ?? existingLead?.emailSourceUrl,
      facebook: existingLead?.facebook,
      instagram: existingLead?.instagram,
      youtube: existingLead?.youtube,
      tiktok: existingLead?.tiktok,
      yelpUrl: existingLead?.yelpUrl,
      yelpRating: existingLead?.yelpRating,
      yelpReviews: existingLead?.yelpReviews,
      houzzUrl: existingLead?.houzzUrl,
      houzzRating: existingLead?.houzzRating,
      houzzReviews: existingLead?.houzzReviews,
      nextdoor: existingLead?.nextdoor,
      linkedinUrl: existingLead?.linkedinUrl,
      linkedinCompanyUrl: existingLead?.linkedinCompanyUrl,
      linkedinOwnerUrl: existingLead?.linkedinOwnerUrl,
      linkedinConfidenceScore: existingLead?.linkedinConfidenceScore,
      linkedinOwnerConfidenceScore: existingLead?.linkedinOwnerConfidenceScore,
      linkedinType: existingLead?.linkedinType ?? "none",
      leadScore: scored.leadScore,
      serviceCategory: qualification.serviceCategory,
      revenueRangeEstimate: qualification.revenueRangeEstimate || null,
      websiteQualityScore: qualification.websiteQualityScore,
      marketingOpportunityScore: qualification.marketingOpportunityScore,
      ppcOpportunityScore: qualification.ppcOpportunityScore,
      seoOpportunityScore: qualification.seoOpportunityScore,
      outreachAngle: qualification.outreachAngle,
      qualityTier: scored.qualityTier,
      peopleEnrichedAt:
        ownerNameFinal || emailFinal
          ? new Date()
          : existingLead?.peopleEnrichedAt,
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
          ownerSourceUrl,
          ownerConfidence,
          teamMembersJson: websitePeople.team.length
            ? JSON.stringify(websitePeople.team)
            : null,
          peopleEnrichedAt: ownerNameFinal || emailFinal ? new Date() : null,
          email: emailFinal,
          emailSourceUrl: websitePeople.emailSourceUrl,
          phone: place.phone,
          website: website || null,
          googleRating: place.rating,
          reviewCount: place.reviewCount,
          address: place.address,
          googleMapsLink: place.mapsUrl,
          leadScore: scored.leadScore,
          serviceCategory: qualification.serviceCategory,
          revenueRangeEstimate: qualification.revenueRangeEstimate || null,
          websiteQualityScore: qualification.websiteQualityScore,
          marketingOpportunityScore: qualification.marketingOpportunityScore,
          ppcOpportunityScore: qualification.ppcOpportunityScore,
          seoOpportunityScore: qualification.seoOpportunityScore,
          outreachAngle: qualification.outreachAngle,
          qualityTier: scored.qualityTier,
          searchId,
          industry: params.industry,
          country: params.country,
          state: addr.state,
          city: addr.city,
          zip: addr.zip,
          latitude: place.latitude,
          longitude: place.longitude,
          verificationStatus: "verified",
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
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

  const linkedinHint =
    pack.linkedinCompany || pack.linkedinOwner || fromWeb.linkedin;

  // Automatic light enrichment (short timeouts — no manual Fetch needed)
  const [
    companyLi,
    qualification,
    facebookPage,
    websitePeople,
    yelp,
    houzz,
    nextdoor,
  ] = await Promise.all([
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
      treatUnreachableAsPending: packTimedOut && !pack.audit.reachable,
    }),
    !(pack.facebook || fromWeb.facebook)
      ? withTimeout(searchFacebookPage(place.name), 2500, null)
      : Promise.resolve(null),
    website
      ? withTimeout(extractWebsitePeople(website), 9000, EMPTY_PEOPLE)
      : Promise.resolve(EMPTY_PEOPLE),
    withTimeout(matchYelpBusiness(place.name, location), 3000, null),
    withTimeout(matchHouzzBusiness(place.name, location), 3000, null),
    withTimeout(matchNextdoorBusiness(place.name, location), 3000, null),
  ]);

  const yelpUrlFinal = pack.yelp || yelp?.url || null;
  const yelpRatingFinal = yelp?.rating ?? null;
  const yelpReviewsFinal = yelp?.reviewCount ?? null;

  const houzzUrlFinal = pack.houzz || houzz?.url || null;
  const houzzRatingFinal = houzz?.rating ?? null;
  const houzzReviewsFinal = houzz?.reviewCount ?? null;

  const nextdoorUrlFinal = pack.nextdoor || nextdoor?.url || null;

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

  // Match against the pool by the strongest identity signals so re-scrapes
  // update the existing row instead of creating a duplicate.
  const existingLead = await findExistingLead({
    name: place.name,
    address: place.address,
    phone: place.phone,
    website: place.website,
    mapsUrl: place.mapsUrl,
  });

  const websiteOwnerCandidate =
    websitePeople.owner?.name &&
    plausiblePersonName(websitePeople.owner.name, place.name)
      ? websitePeople.owner.name
      : null;

  const searchOwnerCandidate =
    ownerFromSearch.ownerName &&
    plausiblePersonName(ownerFromSearch.ownerName, place.name)
      ? ownerFromSearch.ownerName
      : null;

  const existingOwner =
    existingLead?.ownerName &&
    plausiblePersonName(existingLead.ownerName, place.name)
      ? existingLead.ownerName
      : null;

  const ownerNameFinal =
    websiteOwnerCandidate ?? searchOwnerCandidate ?? existingOwner;
  const ownerTitle = websiteOwnerCandidate
    ? websitePeople.owner?.role ?? null
    : searchOwnerCandidate
      ? ownerFromSearch.ownerRole ?? null
      : existingOwner
        ? existingLead?.ownerTitle ?? null
        : null;
  const ownerSourceUrl = websiteOwnerCandidate
    ? websitePeople.owner?.sourceUrl ?? null
    : searchOwnerCandidate
      ? ownerFromSearch.sourceUrl ?? null
      : existingOwner
        ? existingLead?.ownerSourceUrl ?? null
        : null;
  const ownerConfidence = websiteOwnerCandidate
    ? websitePeople.owner?.confidence ?? null
    : searchOwnerCandidate
      ? ownerFromSearch.confidence ?? null
      : existingOwner
        ? existingLead?.ownerConfidence ?? null
        : null;

  const resolvedOwner = ownerUrl || ownerFromSearch.ownerLinkedInUrl || null;
  const primaryLinkedIn = companyUrl || resolvedOwner || fromWeb.linkedin;
  const ownerLinkedInFromSearch =
    Boolean(ownerFromSearch.ownerLinkedInUrl) && !ownerUrl;
  const ownerLinkedInConfidence = resolvedOwner
    ? ownerLinkedInFromSearch
      ? Math.max(ownerFromSearch.confidence, 90)
      : 96
    : null;

  const facebook = pack.facebook || facebookPage || fromWeb.facebook || null;
  const instagram = pack.instagram || fromWeb.instagram || null;

  if (qualification.leadScore < 25) return "skipped-score";

  const websiteQualityScore = qualification.websiteQualityScore;

  const socialSnapshot = {
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    facebook: facebook ?? existingLead?.facebook,
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
    yelp: yelpUrlFinal ?? existingLead?.yelpUrl,
    houzz: houzzUrlFinal ?? existingLead?.houzzUrl,
    nextdoor: nextdoorUrlFinal ?? existingLead?.nextdoor,
  };

  const emailFinal = websitePeople.email ?? existingLead?.email ?? null;
  const websiteFinal = website ?? existingLead?.website ?? null;
  const hasSocial = Boolean(
    socialSnapshot.facebook ||
      socialSnapshot.instagram ||
      socialSnapshot.youtube ||
      socialSnapshot.tiktok ||
      socialSnapshot.yelp ||
      socialSnapshot.houzz ||
      socialSnapshot.nextdoor,
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
      ? "personal"
      : primaryLinkedIn
        ? "company"
        : "none";

  const sharedData = {
    searchId,
    industry: params.industry,
    country: params.country,
    state: addr.state ?? existingLead?.state,
    city: addr.city ?? existingLead?.city,
    zip: addr.zip ?? existingLead?.zip,
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
    yelpUrl: yelpUrlFinal ?? existingLead?.yelpUrl,
    yelpRating: yelpRatingFinal ?? existingLead?.yelpRating,
    yelpReviews: yelpReviewsFinal ?? existingLead?.yelpReviews,
    houzzUrl: houzzUrlFinal ?? existingLead?.houzzUrl,
    houzzRating: houzzRatingFinal ?? existingLead?.houzzRating,
    houzzReviews: houzzReviewsFinal ?? existingLead?.houzzReviews,
    nextdoor: nextdoorUrlFinal ?? existingLead?.nextdoor,
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    linkedinConfidenceScore:
      companyLi.confidence || existingLead?.linkedinConfidenceScore,
    linkedinOwnerConfidenceScore:
      ownerLinkedInConfidence ?? existingLead?.linkedinOwnerConfidenceScore,
    linkedinType: linkedinType ?? existingLead?.linkedinType ?? "none",
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
        ownerSourceUrl,
        ownerConfidence,
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
        yelpUrl: yelpUrlFinal,
        yelpRating: yelpRatingFinal,
        yelpReviews: yelpReviewsFinal,
        houzzUrl: houzzUrlFinal,
        houzzRating: houzzRatingFinal,
        houzzReviews: houzzReviewsFinal,
        nextdoor: nextdoorUrlFinal,
        linkedinUrl: primaryLinkedIn,
        linkedinCompanyUrl: companyUrl,
        linkedinOwnerUrl: resolvedOwner,
        linkedinConfidenceScore: companyLi.confidence || null,
        linkedinOwnerConfidenceScore: ownerLinkedInConfidence,
        linkedinType: linkedinType ?? "none",
        socialEnrichedAt: new Date(),
        qualityTier: scored.qualityTier,
        searchId,
        industry: params.industry,
        country: params.country,
        state: addr.state,
        city: addr.city,
        zip: addr.zip,
        latitude: place.latitude,
        longitude: place.longitude,
        verificationStatus: "verified",
      },
    });
  } catch (err) {
    // Lost a create race (duplicate maps link or phone) — merge into the row
    // another worker just created instead of leaving a duplicate.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
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
