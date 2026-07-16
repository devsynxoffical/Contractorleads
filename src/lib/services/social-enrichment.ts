import { prisma } from "@/lib/prisma";
import {
  discoverSocialFromWebsite,
  searchFacebookPage,
} from "./facebook";
import { resolveLinkedInProfiles } from "./linkedin";
import { matchHouzzBusiness } from "./houzz";
import { matchNextdoorBusiness } from "./nextdoor";
import { matchYelpBusiness } from "./yelp";

type LeadRecord = {
  id: string;
  businessName: string;
  ownerName: string | null;
  website: string | null;
  industry: string | null;
  state: string | null;
  city: string | null;
  zip: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export async function enrichLeadSocial(lead: LeadRecord) {
  const location = [lead.city, lead.state, lead.zip].filter(Boolean).join(", ");

  const [linkedin, websiteSocial, facebookPage, yelp, houzz, nextdoor] =
    await Promise.all([
      resolveLinkedInProfiles(
        lead.businessName,
        location,
        lead.industry ?? "Home services",
        lead.ownerName,
        lead.website
      ),
      lead.website
        ? discoverSocialFromWebsite(lead.website)
        : Promise.resolve({
            facebook: null,
            instagram: null,
            youtube: null,
            tiktok: null,
          }),
      !lead.facebook
        ? searchFacebookPage(lead.businessName)
        : Promise.resolve(null),
      matchYelpBusiness(lead.businessName, location),
      matchHouzzBusiness(lead.businessName, location),
      matchNextdoorBusiness(lead.businessName, location),
    ]);

  const companyLinkedIn =
    linkedin.company.confidence >= 95 ? linkedin.company.url : null;
  const ownerLinkedIn =
    linkedin.owner.confidence >= 95 ? linkedin.owner.url : null;
  const primaryLinkedIn = companyLinkedIn ?? ownerLinkedIn;

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      linkedinUrl: primaryLinkedIn,
      linkedinCompanyUrl: companyLinkedIn,
      linkedinOwnerUrl: ownerLinkedIn,
      linkedinConfidenceScore: linkedin.company.confidence || null,
      linkedinOwnerConfidenceScore: linkedin.owner.confidence || null,
      linkedinType: companyLinkedIn
        ? "company"
        : ownerLinkedIn
          ? "owner"
          : "none",
      facebook: lead.facebook ?? websiteSocial.facebook ?? facebookPage,
      instagram: lead.instagram ?? websiteSocial.instagram,
      youtube: lead.youtube ?? websiteSocial.youtube,
      tiktok: lead.tiktok ?? websiteSocial.tiktok,
      yelpUrl: yelp?.url ?? undefined,
      yelpRating: yelp?.rating ?? undefined,
      yelpReviews: yelp?.reviewCount ?? undefined,
      houzzUrl: houzz?.url ?? undefined,
      houzzRating: houzz?.rating ?? undefined,
      houzzReviews: houzz?.reviewCount ?? undefined,
      nextdoor: nextdoor?.url ?? undefined,
      socialEnrichedAt: new Date(),
    },
  });

  return {
    lead: updated,
    found: {
      linkedinCompany: Boolean(companyLinkedIn),
      linkedinOwner: Boolean(ownerLinkedIn),
      facebook: Boolean(updated.facebook),
      instagram: Boolean(updated.instagram),
      youtube: Boolean(updated.youtube),
      tiktok: Boolean(updated.tiktok),
    },
  };
}

export function computeVerificationScore(lead: {
  phone: string | null;
  email: string | null;
  website: string | null;
  googleRating: number | null;
  linkedinCompanyUrl: string | null;
  linkedinOwnerUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  yelpUrl: string | null;
}): number {
  let score = 40;
  if (lead.phone) score += 15;
  if (lead.email) score += 10;
  if (lead.website) score += 10;
  if (lead.googleRating && lead.googleRating >= 4) score += 10;
  if (lead.linkedinCompanyUrl) score += 8;
  if (lead.linkedinOwnerUrl) score += 5;
  if (lead.facebook) score += 5;
  if (lead.instagram) score += 4;
  if (lead.yelpUrl) score += 3;
  return Math.min(100, score);
}
