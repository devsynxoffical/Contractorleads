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
};

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
    limit: params.locationScope === "country" ? 10 : 8,
  });

  const leads = [];

  for (const place of places) {
    // Trust Google Business Profile website — never wipe it because our
    // reachability check failed (many sites block bots / HEAD).
    const website = place.website;
    const websiteReachable = website
      ? await withTimeout(verifyWebsite(website), 9000, false)
      : false;

    // Owner/team first so the discovered owner name can drive LinkedIn lookup
    const websitePeople = website
      ? await withTimeout(extractWebsitePeople(website), 12000, EMPTY_PEOPLE)
      : EMPTY_PEOPLE;

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

    // Soft-bump website quality when the URL actually responds
    const websiteQualityScore = website
      ? Math.max(
          qualification.websiteQualityScore ?? 0,
          websiteReachable ? 70 : 50,
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
          houzzUrl: houzz?.url ?? existingLead.houzzUrl,
          nextdoor: nextdoor?.url ?? existingLead.nextdoor,
          linkedinUrl: linkedin.url ?? existingLead.linkedinUrl,
          linkedinCompanyUrl:
            linkedin.companyUrl ?? existingLead.linkedinCompanyUrl,
          linkedinOwnerUrl: linkedin.ownerUrl ?? existingLead.linkedinOwnerUrl,
          leadScore: Math.max(existingLead.leadScore, qualification.leadScore),
          qualityTier: qualification.qualityTier ?? existingLead.qualityTier,
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

  return { search, leads };
}
