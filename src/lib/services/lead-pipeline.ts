import { prisma } from "@/lib/prisma";
import { searchGooglePlaces, verifyWebsite } from "./google-places";
import { matchYelpBusiness } from "./yelp";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { resolveLinkedIn } from "./linkedin";
import { qualifyLead } from "./qualification";

export type SearchParams = {
  userId: string;
  industry: string;
  state: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius: number;
};

/** Race a promise against a timeout; on timeout return fallback (never block pipeline). */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
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
    [params.city, params.state, params.zip].filter(Boolean).join(", ");

  const search = await prisma.search.create({
    data: {
      userId: params.userId,
      industry: params.industry,
      state: params.state,
      city: params.city,
      zip: params.zip,
      radius: params.radius,
    },
  });

  const places = await searchGooglePlaces({
    industry: params.industry,
    state: params.state,
    city: params.city,
    zip: params.zip,
    customLocation: params.customLocation,
    radius: params.radius,
    limit: 8,
  });

  const leads = [];

  for (const place of places) {
    let website = place.website;
    if (website) {
      const valid = await verifyWebsite(website);
      if (!valid) website = undefined;
    }

    const [yelp, houzz, nextdoor, linkedin, qualification] = await Promise.all([
      matchYelpBusiness(place.name, location),
      withTimeout(matchHouzzBusiness(place.name, location), 8000, null),
      withTimeout(matchNextdoorBusiness(place.name, location), 5000, null),
      resolveLinkedIn(place.name, location, params.industry, undefined, website),
      qualifyLead(place, params.industry, Boolean(website)),
    ]);

    if (qualification.leadScore < 30) continue;

    const lead = await prisma.lead.create({
      data: {
        businessName: place.name,
        phone: place.phone,
        website: website ?? null,
        googleRating: place.rating,
        reviewCount: place.reviewCount,
        address: place.address,
        googleMapsLink: place.mapsUrl,
        leadScore: qualification.leadScore,
        serviceCategory: qualification.serviceCategory,
        revenueRangeEstimate: qualification.revenueRangeEstimate,
        websiteQualityScore: qualification.websiteQualityScore,
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
