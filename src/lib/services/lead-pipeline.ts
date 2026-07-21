import { prisma } from "@/lib/prisma";
import { searchGooglePlaces, verifyWebsite } from "./google-places";
import { matchYelpBusiness } from "./yelp";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { findLinkedInCompanyUrl } from "./linkedin";
import { qualifyLead } from "./qualification";
import {
  extractWebsitePeople,
  type WebsitePeopleResult,
} from "./website-people";
import { searchFacebookPage } from "./facebook";
import { scrapeWebsiteSocialPack } from "./website-social-pack";
import { mapPool } from "@/lib/utils/async-pool";
import type { PlaceResult } from "./google-places";

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

/** LinkedIn + consumer social + (owner name or public email). */
export function leadHasLinkedInSocialAndOwner(lead: SocialFields): boolean {
  const hasLinkedIn = Boolean(
    lead.linkedinUrl || lead.linkedinCompanyUrl || lead.linkedinOwnerUrl,
  );
  const hasSocial = Boolean(
    lead.facebook || lead.instagram || lead.youtube || lead.tiktok,
  );
  const hasOwnerOrContact = Boolean(
    lead.ownerName?.trim() || lead.email?.trim(),
  );
  return hasLinkedIn && hasSocial && hasOwnerOrContact;
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
  // Over-fetch Places heavily when social filter is on (many candidates lack profiles)
  const fetchLimit = requireSocial
    ? Math.min(1200, Math.max(targetCount * 12, targetCount + 80))
    : Math.min(1200, Math.max(targetCount * 2, targetCount + 20));

  const preferRules = true; // keep volume searches fast
  const placeConcurrency = requireSocial
    ? targetCount >= 100
      ? 12
      : 8
    : targetCount >= 250
      ? 14
      : targetCount >= 80
        ? 10
        : 6;

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

  // One deep website scrape for LinkedIn + socials (about/contact/team pages)
  const pack = website
    ? await withTimeout(scrapeWebsiteSocialPack(website), 12000, emptyPack)
    : emptyPack;

  const [websiteReachable, websitePeople, companyLi, yelp, houzz, nextdoor, qualification, facebookPage] =
    await Promise.all([
      website ? withTimeout(verifyWebsite(website), 3500, false) : Promise.resolve(false),
      website
        ? withTimeout(extractWebsitePeople(website), 7000, EMPTY_PEOPLE)
        : Promise.resolve(EMPTY_PEOPLE),
      withTimeout(
        findLinkedInCompanyUrl(
          place.name,
          location,
          params.industry,
          website,
          {
            websiteCompanyUrl: pack.linkedinCompany,
            skipWebsiteScrape: true,
          },
        ),
        requireSocial ? 14000 : 8000,
        { url: null, confidence: 0, source: null },
      ),
      withTimeout(matchYelpBusiness(place.name, location), 5000, null),
      withTimeout(matchHouzzBusiness(place.name, location), 4000, null),
      withTimeout(matchNextdoorBusiness(place.name, location), 3500, null),
      qualifyLead({ ...place, website }, params.industry, Boolean(website), {
        preferRules,
        timeoutMs: 1,
      }),
      !pack.facebook
        ? withTimeout(searchFacebookPage(place.name), 5000, null)
        : Promise.resolve(null),
    ]);

  // Serper fallback for missing LinkedIn / social when filter is on
  let serperLinkedIn: string | null = null;
  let serperSocial: {
    facebook: string | null;
    instagram: string | null;
  } = { facebook: null, instagram: null };

  const hasLi =
    companyLi.url || pack.linkedinCompany || pack.linkedinOwner;
  const hasSocial =
    pack.facebook ||
    pack.instagram ||
    pack.youtube ||
    pack.tiktok ||
    facebookPage;

  if (requireSocial && (!hasLi || !hasSocial)) {
    const { searchPublicWeb } = await import("./web-search");
    const hits = await withTimeout(
      searchPublicWeb(
        `"${place.name}" ${location} (linkedin OR facebook OR instagram)`,
        8,
      ),
      7000,
      [],
    );
    for (const hit of hits) {
      const lower = hit.url.toLowerCase();
      if (!serperLinkedIn && lower.includes("linkedin.com")) {
        serperLinkedIn = hit.url;
      }
      if (!serperSocial.facebook && lower.includes("facebook.com")) {
        serperSocial.facebook = hit.url.split("?")[0];
      }
      if (!serperSocial.instagram && lower.includes("instagram.com")) {
        serperSocial.instagram = hit.url.split("?")[0];
      }
    }
  }

  const companyUrl = companyLi.url || pack.linkedinCompany;
  const ownerUrl = pack.linkedinOwner;
  const primaryLinkedIn = companyUrl || ownerUrl || serperLinkedIn;

  // Optional owner LinkedIn via Proxycurl when we have an owner name
  let resolvedOwner = ownerUrl;
  const apiKey = process.env.LINKEDIN_DATA_API_KEY;
  if (!resolvedOwner && websitePeople.owner?.name && apiKey) {
    try {
      const first = websitePeople.owner.name.split(" ")[0] || "";
      const last = websitePeople.owner.name.split(" ").slice(1).join(" ") || "";
      const domain = website
        ? new URL(website.startsWith("http") ? website : `https://${website}`)
            .hostname.replace(/^www\./, "")
        : null;
      const domainParam = domain
        ? `&company_domain=${encodeURIComponent(domain)}`
        : "";
      const response = await fetch(
        `https://nubela.co/proxycurl/api/linkedin/profile/resolve?first_name=${encodeURIComponent(first)}&last_name=${encodeURIComponent(last)}${domainParam}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (response.ok) {
        const data = (await response.json()) as { url?: string };
        if (data.url?.includes("linkedin.com/in/")) {
          resolvedOwner = data.url.split("?")[0];
        }
      }
    } catch {
      // ignore
    }
  }

  const facebook =
    pack.facebook || facebookPage || serperSocial.facebook || null;
  const instagram = pack.instagram || serperSocial.instagram || null;

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
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    facebook: facebook ?? existingLead?.facebook,
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
    ownerName: websitePeople.owner?.name ?? existingLead?.ownerName,
    email: websitePeople.email ?? existingLead?.email,
  };

  if (requireSocial && !leadHasLinkedInSocialAndOwner(socialSnapshot)) {
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
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
    yelpUrl: yelp?.url ?? existingLead?.yelpUrl,
    yelpRating: yelp?.rating ?? existingLead?.yelpRating,
    yelpReviews: yelp?.reviewCount ?? existingLead?.yelpReviews,
    houzzUrl: houzz?.url ?? existingLead?.houzzUrl,
    houzzRating: houzz?.rating ?? existingLead?.houzzRating,
    houzzReviews: houzz?.reviewCount ?? existingLead?.houzzReviews,
    nextdoor: nextdoor?.url ?? existingLead?.nextdoor,
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
      yelpUrl: yelp?.url ?? null,
      yelpRating: yelp?.rating ?? null,
      yelpReviews: yelp?.reviewCount ?? null,
      houzzUrl: houzz?.url ?? null,
      houzzRating: houzz?.rating ?? null,
      houzzReviews: houzz?.reviewCount ?? null,
      nextdoor: nextdoor?.url ?? null,
      linkedinUrl: primaryLinkedIn,
      linkedinCompanyUrl: companyUrl,
      linkedinOwnerUrl: resolvedOwner,
      linkedinConfidenceScore: companyLi.confidence || null,
      linkedinOwnerConfidenceScore: resolvedOwner ? 96 : null,
      linkedinType,
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
