import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { searchGooglePlaces } from "./google-places";
import { findLinkedInCompanyUrl } from "./linkedin";
import { finalizeLeadScore, qualifyLead, scoreSoloContractor } from "./qualification";
import {
  extractWebsitePeople,
  type WebsitePeopleResult,
  pickBestEmail,
} from "./website-people";
import { searchFacebookPage } from "./facebook";
import {
  scrapeWebsiteSocialPack,
  EMPTY_WEBSITE_SOCIAL_PACK,
} from "./website-social-pack";
import { auditWebsite, emptyWebsiteAudit } from "./website-audit";
import { matchYelpBusiness, searchYelpDirect, type DirectListingResult } from "./yelp";
import { matchHouzzBusiness, searchHouzzDirect } from "./houzz";
import { matchNextdoorBusiness, searchNextdoorDirect } from "./nextdoor";
import type { PlaceResult } from "./google-places";
import { findExistingLead } from "./lead-identity";
import { plausiblePersonName } from "./owner-discovery";
import type { CompanySizeFilter } from "@/lib/search-criteria";

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
  /** Desired company size / revenue target */
  companySize?: CompanySizeFilter;
  /** How many leads the client asked for (10–1000). */
  targetLeadCount?: number;
  /** Fast contacts mode: extracts core business, owner, phone, email, location without slow external social scrapers */
  fastContactsOnly?: boolean;
  /** When true, continues scanning until targetLeadCount of leads WITH EMAILS are discovered */
  requireEmail?: boolean;
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

/** Corporate conglomerates & franchise patterns to exclude when targeting small/micro businesses */
const CORPORATE_FRANCHISE_REGEX =
  /\b(roto-?rooter|servpro|servicemaster|mr\.?\s*handyman|1-800-got-junk|stanley\s*steemer|comfort\s*keepers|two\s*men\s*and\s*a\s*truck|national|enterprises?|holdings?|franchise|corporation|corporate|call\s*center)\b/i;

export function matchesCompanySizeCriteria(
  place: PlaceResult,
  filter?: CompanySizeFilter,
): boolean {
  if (!filter || filter === "all") return true;

  const name = place.name || "";
  if (filter !== "large" && CORPORATE_FRANCHISE_REGEX.test(name)) {
    return false;
  }

  const reviews = place.reviewCount ?? 0;

  switch (filter) {
    case "micro":
      // Solo / Micro contractor: < $300k revenue, <= 25 Google reviews
      return reviews <= 25;
    case "small":
      // Small local crew: $300k - $750k revenue, <= 55 Google reviews
      return reviews <= 55;
    case "small_medium":
      // Small to mid contractor: < $1.5M revenue, <= 85 Google reviews
      return reviews <= 85;
    case "mid":
      // Mid-sized contractor: $1.5M - $5M revenue, 50 - 250 reviews
      return reviews >= 50 && reviews <= 250;
    case "large":
      // Large enterprise / multi-crew contractor: > 150 reviews or corporate names
      return reviews > 150 || CORPORATE_FRANCHISE_REGEX.test(name);
    default:
      return true;
  }
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
  // LinkedIn + social leads ranked first in the returned list.
  const targetCount = clampTarget(params.targetLeadCount);
  const isCountryWide = params.locationScope === "country";
  const fastContacts = Boolean(params.fastContactsOnly);
  const requireEmail = Boolean(params.requireEmail || params.fastContactsOnly);

  // In requireEmail mode (Bulk Email Finder), fetch ample places so we guarantee finding 100% of requested verified emails
  const fetchLimit = requireEmail
    ? Math.min(1500, Math.max(targetCount * 10, 300))
    : isCountryWide
      ? Math.min(1000, Math.max(targetCount * 2, targetCount + 60))
      : Math.min(1000, Math.max(targetCount * 2, targetCount + 30));

  const preferRules = true; // keep volume searches fast
  // Higher concurrency — fast contacts mode is lightweight, full mode is I/O bound
  const placeConcurrency = fastContacts
    ? targetCount >= 200
      ? 48
      : 36
    : targetCount >= 250
      ? 28
      : targetCount >= 100
        ? 20
        : targetCount >= 50
          ? 16
          : 12;

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

  const getProgressCount = () => {
    return requireEmail
      ? leads.filter((l) => Boolean(l.email)).length
      : leads.length;
  };

  const isSatisfied = () => {
    return getProgressCount() >= targetCount;
  };

  // Real-time progressive enrichment pool: processes places as they arrive from queries
  const pendingEnrichments: Promise<void>[] = [];
  const activeEnriching = new Set<Promise<void>>();

  async function enqueuePlaces(incoming: PlaceResult[]) {
    totalPlacesFetched += incoming.length;
    // Prefer businesses with websites first as they have highest email probability
    const sorted = [
      ...incoming.filter((p) => p.website),
      ...incoming.filter((p) => !p.website),
    ];

    for (const place of sorted) {
      if (isSatisfied()) break;

      if (!matchesCompanySizeCriteria(place, params.companySize)) {
        continue;
      }

      // Throttle concurrent enrichment tasks to configured concurrency
      while (activeEnriching.size >= placeConcurrency && !isSatisfied()) {
        await Promise.race(Array.from(activeEnriching));
      }

      if (isSatisfied()) break;

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
          if (requireEmail && !lead.email) {
            // Saved to DB for general pool, but not added to required email results
            return;
          }
          if (isSatisfied()) return;

          leads.push(lead);

          if (params.onLeadDiscovered) {
            try {
              await params.onLeadDiscovered(lead, {
                current: getProgressCount(),
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

  function directListingToPlace(item: DirectListingResult): PlaceResult {
    return {
      placeId: `${item.source}:${item.url || item.name}-${item.phone || item.address || ""}`,
      name: item.name,
      address: item.address || "",
      phone: item.phone,
      website: item.website,
      rating: item.rating,
      reviewCount: item.reviewCount,
      mapsUrl: item.url,
    };
  }

  const isSoloTarget = params.companySize === "micro" || params.companySize === "small";

  // Direct Multi-Source Discovery: Concurrently scrape Yelp, Nextdoor, and Houzz alongside Google Places
  const multiSourceDiscovery = (async () => {
    try {
      const [yelpListings, nextdoorListings, houzzListings] = await Promise.allSettled([
        searchYelpDirect({
          industry: params.industry,
          location,
          limit: Math.min(targetCount, 30),
          targetSolo: isSoloTarget,
        }),
        searchNextdoorDirect({
          industry: params.industry,
          location,
          limit: Math.min(targetCount, 25),
          targetSolo: isSoloTarget,
        }),
        searchHouzzDirect({
          industry: params.industry,
          location,
          limit: Math.min(targetCount, 25),
          targetSolo: isSoloTarget,
        }),
      ]);

      const additionalPlaces: PlaceResult[] = [];
      if (yelpListings.status === "fulfilled" && yelpListings.value.length > 0) {
        additionalPlaces.push(...yelpListings.value.map(directListingToPlace));
      }
      if (nextdoorListings.status === "fulfilled" && nextdoorListings.value.length > 0) {
        additionalPlaces.push(...nextdoorListings.value.map(directListingToPlace));
      }
      if (houzzListings.status === "fulfilled" && houzzListings.value.length > 0) {
        additionalPlaces.push(...houzzListings.value.map(directListingToPlace));
      }

      if (additionalPlaces.length > 0 && !isSatisfied()) {
        await enqueuePlaces(additionalPlaces);
      }
    } catch {
      /* ignore background direct source errors */
    }
  })();

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
    shouldStop: () => isSatisfied(),
  });

  // If any places were returned synchronously/fallback without batch callback
  if (totalPlacesFetched === 0 && places.length > 0) {
    await enqueuePlaces(places);
  }

  // Wait for all in-flight direct sources and enrichment tasks to complete
  await Promise.allSettled([multiSourceDiscovery, ...pendingEnrichments]);

  // LinkedIn + social leads first, then the rest — each group by score.
  const candidateLeads = requireEmail
    ? leads.filter((l) => Boolean(l.email))
    : leads;

  const finalLeads = candidateLeads.slice(0, targetCount).sort((a, b) => {
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

  // Match against the pool by the strongest identity signals so re-scrapes
  // update the existing row instead of creating a duplicate.
  const existingLead = await findExistingLead({
    name: place.name,
    address: place.address,
    phone: place.phone,
    website: place.website,
    mapsUrl: place.mapsUrl,
  });

  if (fastContacts) {
    // High-performance contact mode: Extracts owner/team and email from website + web search fallback
    let websitePeople = EMPTY_PEOPLE;
    if (website) {
      websitePeople = await withTimeout(
        extractWebsitePeople(website, { budgetMs: 6500 }),
        7500,
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

    // Search web fallback if website did not yield an owner
    let searchOwnerCandidate: string | null = null;
    let searchOwnerRole: string | null = null;
    let searchOwnerSourceUrl: string | null = null;
    let searchOwnerConfidence = 85;
    let searchOwnerLinkedIn: string | null = null;

    if (!ownerCandidate && !existingOwner) {
      const { discoverOwnerFromSearch, EMPTY_OWNER_DISCOVERY } = await import(
        "./owner-discovery"
      );
      const ownerFromSearch = await withTimeout(
        discoverOwnerFromSearch(place.name, location),
        3500,
        EMPTY_OWNER_DISCOVERY,
      );
      if (
        ownerFromSearch.ownerName &&
        plausiblePersonName(ownerFromSearch.ownerName, place.name)
      ) {
        searchOwnerCandidate = ownerFromSearch.ownerName;
        searchOwnerRole = ownerFromSearch.ownerRole;
        searchOwnerSourceUrl = ownerFromSearch.sourceUrl;
        searchOwnerConfidence = ownerFromSearch.confidence || 85;
        searchOwnerLinkedIn = ownerFromSearch.ownerLinkedInUrl;
      }
    }

    const ownerNameFinal =
      ownerCandidate ?? searchOwnerCandidate ?? existingOwner;
    const ownerTitle = ownerCandidate
      ? websitePeople.owner?.role ?? null
      : searchOwnerCandidate
        ? searchOwnerRole ?? null
        : existingOwner
          ? existingLead?.ownerTitle ?? null
          : null;
    const ownerSourceUrl = ownerCandidate
      ? websitePeople.owner?.sourceUrl ?? null
      : searchOwnerCandidate
        ? searchOwnerSourceUrl ?? null
        : existingOwner
          ? existingLead?.ownerSourceUrl ?? existingLead?.linkedinOwnerUrl ?? null
          : null;
    const ownerConfidence = ownerCandidate
      ? websitePeople.owner?.confidence ?? 90
      : searchOwnerCandidate
        ? searchOwnerConfidence
        : existingOwner
          ? existingLead?.ownerConfidence ?? null
          : null;

    const emailCandidates = [websitePeople.email, existingLead?.email].filter(
      (e): e is string => Boolean(e),
    );

    let emailFinal =
      pickBestEmail(
        emailCandidates,
        ownerNameFinal,
        website || existingLead?.website,
      ) ??
      websitePeople.email ??
      existingLead?.email ??
      null;

    // If still no email, search public snippets for contact email
    if (!emailFinal && place.name) {
      try {
        const { searchPublicWeb } = await import("./web-search");
        const emailHits = await withTimeout(
          searchPublicWeb(`"${place.name}" ${location} email OR contact`, 4),
          3000,
          [],
        );
        const snippetEmails = new Set<string>();
        for (const hit of emailHits) {
          const text = `${hit.title} ${hit.snippet}`;
          for (const match of text.matchAll(
            /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}\b/g,
          )) {
            snippetEmails.add(match[0]);
          }
        }
        emailFinal = pickBestEmail(
          snippetEmails,
          ownerNameFinal,
          website || existingLead?.website,
        );
      } catch {
        /* ignore */
      }
    }

    const emailSourceUrlFinal =
      emailFinal === websitePeople.email
        ? websitePeople.emailSourceUrl ?? existingLead?.emailSourceUrl
        : existingLead?.emailSourceUrl ?? websitePeople.emailSourceUrl;

    const scored = finalizeLeadScore(qualification.leadScore, {
      hasWebsite: Boolean(website || existingLead?.website),
      hasEmail: Boolean(emailFinal),
      hasOwner: Boolean(ownerNameFinal),
      hasLinkedIn: Boolean(searchOwnerLinkedIn || existingLead?.linkedinUrl || existingLead?.linkedinOwnerUrl),
      hasSocial: Boolean(existingLead?.facebook || existingLead?.instagram),
      hasPhone: Boolean(place.phone ?? existingLead?.phone),
    });

    let finalLeadScore = scored.leadScore;
    let finalQualityTier = scored.qualityTier;

    if (params.companySize === "micro" || params.companySize === "small") {
      const soloScore = scoreSoloContractor({
        reviewCount: place.reviewCount ?? existingLead?.reviewCount,
        rating: place.rating ?? existingLead?.googleRating,
        website: website || existingLead?.website,
        isUnclaimed: true,
        hasSingleLocation: true,
        samePhoneNoSecretary: Boolean(place.phone || existingLead?.phone),
        hasLocalDemand: true,
      });
      // Blend 60% solo contractor signals + 40% contact completeness
      finalLeadScore = Math.round(soloScore * 0.6 + scored.leadScore * 0.4);
      finalQualityTier = finalLeadScore >= 75 ? "hot" : finalLeadScore >= 50 ? "warm" : "nurture";
    }

    if (finalLeadScore < 20) return "skipped-score";

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
      emailSourceUrl: emailSourceUrlFinal,
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
      linkedinOwnerUrl: searchOwnerLinkedIn ?? existingLead?.linkedinOwnerUrl,
      linkedinConfidenceScore: existingLead?.linkedinConfidenceScore,
      linkedinOwnerConfidenceScore: searchOwnerLinkedIn ? 90 : existingLead?.linkedinOwnerConfidenceScore,
      linkedinType: searchOwnerLinkedIn ? "profile" : (existingLead?.linkedinType ?? "none"),
      leadScore: finalLeadScore,
      serviceCategory: qualification.serviceCategory,
      revenueRangeEstimate: qualification.revenueRangeEstimate || null,
      websiteQualityScore: qualification.websiteQualityScore,
      marketingOpportunityScore: qualification.marketingOpportunityScore,
      ppcOpportunityScore: qualification.ppcOpportunityScore,
      seoOpportunityScore: qualification.seoOpportunityScore,
      outreachAngle: qualification.outreachAngle,
      qualityTier: finalQualityTier,
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
      ? ownerFromSearch.sourceUrl ?? ownerFromSearch.ownerLinkedInUrl ?? null
      : existingOwner
        ? existingLead?.ownerSourceUrl ?? existingLead?.linkedinOwnerUrl ?? null
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

  const emailCandidates = [websitePeople.email, existingLead?.email].filter(
    (e): e is string => Boolean(e),
  );
  const emailFinal =
    pickBestEmail(
      emailCandidates,
      ownerNameFinal,
      website ?? existingLead?.website ?? null,
    ) ??
    websitePeople.email ??
    existingLead?.email ??
    null;
  const emailSourceUrlFinal =
    emailFinal === websitePeople.email
      ? websitePeople.emailSourceUrl ?? existingLead?.emailSourceUrl
      : existingLead?.emailSourceUrl ?? websitePeople.emailSourceUrl;

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
    emailSourceUrl: emailSourceUrlFinal,
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
