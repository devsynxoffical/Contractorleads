import { prisma } from "@/lib/prisma";
import { searchGooglePlaces } from "./google-places";
import { findLinkedInCompanyUrl } from "./linkedin";
import { qualifyLead } from "./qualification";
import {
  extractWebsitePeople,
  type WebsitePeopleResult,
} from "./website-people";
import { searchFacebookPage } from "./facebook";
import { scrapeWebsiteSocialPack } from "./website-social-pack";
import { matchYelpBusiness } from "./yelp";
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
  /** Default true — prefer LinkedIn + social; still fills exact target count. */
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
};

type SocialMode = "strict" | "soft" | "any";

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

export function leadHasLinkedInOrSocial(lead: SocialFields): boolean {
  const hasLinkedIn = Boolean(
    lead.linkedinUrl || lead.linkedinCompanyUrl || lead.linkedinOwnerUrl,
  );
  const hasSocial = Boolean(
    lead.facebook || lead.instagram || lead.youtube || lead.tiktok,
  );
  return hasLinkedIn || hasSocial;
}

/** @deprecated alias */
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

function passesSocialMode(lead: SocialFields, mode: SocialMode): boolean {
  if (mode === "any") return true;
  if (mode === "soft") return leadHasLinkedInOrSocial(lead);
  return leadHasLinkedInAndSocial(lead);
}

export async function runLeadPipeline(params: SearchParams) {
  const preferSocial = params.requireSocialPresence !== false;
  const targetCount = clampTarget(params.targetLeadCount);
  // Over-fetch hard so we can still hit exact count after social filtering
  const fetchLimit = Math.min(
    1200,
    Math.max(targetCount * (preferSocial ? 20 : 3), targetCount + 100),
  );

  const preferRules = true;
  const placeConcurrency =
    targetCount >= 250 ? 22 : targetCount >= 80 ? 16 : 12;

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
  const acceptedKeys = new Set<string>();

  const ordered = [
    ...places.filter((p) => p.website),
    ...places.filter((p) => !p.website),
  ];

  // Fill to exact target: strict → soft → any (so 50 means 50)
  const modes: SocialMode[] = preferSocial
    ? ["strict", "soft", "any"]
    : ["any"];

  for (const mode of modes) {
    if (leads.length >= targetCount) break;

    await mapPool(ordered, placeConcurrency, async (place) => {
      if (leads.length >= targetCount) return;

      const key =
        place.mapsUrl ||
        `${place.name}|${place.address || ""}|${place.phone || ""}`;
      if (acceptedKeys.has(key)) return;

      if (mode === "strict") scanned += 1;

      if (preferSocial && mode !== "any" && !place.website) {
        if (mode === "strict") skippedNoSocial += 1;
        return;
      }

      const lead = await enrichAndPersistPlace({
        place,
        params,
        searchId: search.id,
        location,
        socialMode: mode,
        preferRules,
      });

      if (lead === "skipped-social") {
        if (mode === "strict") skippedNoSocial += 1;
        return;
      }
      if (lead === "skipped-score") return;
      if (lead === "already-counted") {
        acceptedKeys.add(key);
        return;
      }
      if (leads.length >= targetCount) return;
      if (leads.some((l) => l.id === lead.id)) {
        acceptedKeys.add(key);
        return;
      }

      acceptedKeys.add(key);
      leads.push(lead);
    });
  }

  const finalLeads = leads.slice(0, targetCount);

  await prisma.search.update({
    where: { id: search.id },
    data: { resultCount: finalLeads.length },
  });

  return {
    search,
    leads: finalLeads,
    meta: {
      requireSocialPresence: preferSocial,
      skippedNoSocial,
      placesScanned: scanned || places.length,
      placesFetched: places.length,
      targetLeadCount: targetCount,
      deliveredCount: finalLeads.length,
    },
  };
}

async function enrichAndPersistPlace(opts: {
  place: PlaceResult;
  params: SearchParams;
  searchId: string;
  location: string;
  socialMode: SocialMode;
  preferRules: boolean;
}): Promise<
  | Awaited<ReturnType<typeof prisma.lead.create>>
  | "skipped-social"
  | "skipped-score"
  | "already-counted"
> {
  const { place, params, searchId, location, socialMode, preferRules } = opts;

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

  // Parallel: social pack + owner/team (so people always attempt)
  const [pack, websitePeople] = await Promise.all([
    website
      ? withTimeout(scrapeWebsiteSocialPack(website), 5000, emptyPack)
      : Promise.resolve(emptyPack),
    website
      ? withTimeout(extractWebsitePeople(website), 9000, EMPTY_PEOPLE)
      : Promise.resolve(EMPTY_PEOPLE),
  ]);

  const packHasLi = Boolean(pack.linkedinCompany || pack.linkedinOwner);
  const packHasSocial = Boolean(
    pack.facebook || pack.instagram || pack.youtube || pack.tiktok,
  );

  const fromWeb =
    socialMode !== "any" && (!packHasLi || !packHasSocial)
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
  const socialHint =
    pack.facebook ||
    pack.instagram ||
    pack.youtube ||
    pack.tiktok ||
    fromWeb.facebook ||
    fromWeb.instagram;

  const earlySnapshot: SocialFields = {
    linkedinUrl: linkedinHint,
    linkedinCompanyUrl: pack.linkedinCompany || fromWeb.linkedin,
    linkedinOwnerUrl: pack.linkedinOwner,
    facebook: pack.facebook || fromWeb.facebook,
    instagram: pack.instagram || fromWeb.instagram,
    youtube: pack.youtube,
    tiktok: pack.tiktok,
  };

  if (!passesSocialMode(earlySnapshot, socialMode)) {
    return "skipped-social";
  }

  const [companyLi, qualification, facebookPage, yelp] = await Promise.all([
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
              skipWebSearch: socialMode === "any",
            },
          ),
          3000,
          { url: null, confidence: 0, source: null },
        ),
    qualifyLead({ ...place, website }, params.industry, Boolean(website), {
      preferRules,
      timeoutMs: 1,
    }),
    !(pack.facebook || fromWeb.facebook)
      ? withTimeout(searchFacebookPage(place.name), 2500, null)
      : Promise.resolve(null),
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
  const primaryLinkedIn = companyUrl || ownerUrl || fromWeb.linkedin;
  const resolvedOwner = ownerUrl;
  const ownerName = websitePeople.owner?.name ?? null;
  const ownerTitle = websitePeople.owner?.role ?? null;

  const facebook =
    pack.facebook || facebookPage || fromWeb.facebook || null;
  const instagram = pack.instagram || fromWeb.instagram || null;

  if (qualification.leadScore < 25) return "skipped-score";

  const websiteQualityScore = website
    ? Math.min(100, Math.round(qualification.websiteQualityScore ?? 40))
    : qualification.websiteQualityScore;

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

  // If this lead was already added in a stricter pass for this search, skip
  if (existingLead?.searchId === searchId) {
    return "already-counted";
  }

  const socialSnapshot: SocialFields = {
    linkedinUrl: primaryLinkedIn ?? existingLead?.linkedinUrl,
    linkedinCompanyUrl: companyUrl ?? existingLead?.linkedinCompanyUrl,
    linkedinOwnerUrl: resolvedOwner ?? existingLead?.linkedinOwnerUrl,
    facebook: facebook ?? existingLead?.facebook,
    instagram: instagram ?? existingLead?.instagram,
    youtube: pack.youtube ?? existingLead?.youtube,
    tiktok: pack.tiktok ?? existingLead?.tiktok,
  };

  if (!passesSocialMode(socialSnapshot, socialMode)) {
    return "skipped-social";
  }

  const linkedinType = companyUrl
    ? "company"
    : resolvedOwner
      ? "owner"
      : primaryLinkedIn
        ? "company"
        : "none";

  const teamJson = websitePeople.team.length
    ? JSON.stringify(websitePeople.team)
    : existingLead?.teamMembersJson ?? null;

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
    ownerName: ownerName ?? existingLead?.ownerName,
    ownerTitle: ownerTitle ?? existingLead?.ownerTitle,
    ownerSourceUrl:
      websitePeople.owner?.sourceUrl ?? existingLead?.ownerSourceUrl,
    ownerConfidence:
      websitePeople.owner?.confidence ?? existingLead?.ownerConfidence,
    teamMembersJson: teamJson,
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
    peopleEnrichedAt:
      websitePeople.owner ||
      websitePeople.team.length ||
      websitePeople.email
        ? new Date()
        : existingLead?.peopleEnrichedAt,
    socialEnrichedAt: new Date(),
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
      ownerName,
      ownerTitle,
      ownerSourceUrl: websitePeople.owner?.sourceUrl ?? null,
      ownerConfidence: websitePeople.owner?.confidence ?? null,
      teamMembersJson: websitePeople.team.length
        ? JSON.stringify(websitePeople.team)
        : null,
      peopleEnrichedAt:
        websitePeople.owner ||
        websitePeople.team.length ||
        websitePeople.email
          ? new Date()
          : null,
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
