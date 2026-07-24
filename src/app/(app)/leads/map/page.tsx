import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  PageHeader,
  PrimaryActionLink,
} from "@/components/layout/page-header";
import { LeadGeoMap } from "@/components/leads/lead-geo-map";
import { normalizeCountryCode, resolveLeadCoords } from "@/lib/geo";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { requirePlanFeatureOrRedirect } from "@/lib/plan-access-server";

export default async function LeadMapPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  requirePlanFeatureOrRedirect(user, "map");

  const leads = await prisma.lead.findMany({
    where: {
      search: { userId: user.id },
    },
    take: 500,
    orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      businessName: true,
      address: true,
      latitude: true,
      longitude: true,
      qualityTier: true,
      googleMapsLink: true,
      city: true,
      state: true,
      country: true,
      industry: true,
      leadScore: true,
    },
  });

  const geoLeads = [];
  const backfill: Array<{ id: string; latitude: number; longitude: number }> =
    [];
  let unmapped = 0;

  for (const l of leads) {
    const coords = resolveLeadCoords(l);
    if (!coords) {
      unmapped += 1;
      continue;
    }

    const hadStored =
      l.latitude != null &&
      l.longitude != null &&
      Number.isFinite(l.latitude) &&
      Number.isFinite(l.longitude);
    if (!hadStored) {
      backfill.push({
        id: l.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }

    geoLeads.push({
      id: l.id,
      businessName: l.businessName,
      address: l.address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      qualityTier: l.qualityTier,
      googleMapsLink: l.googleMapsLink,
      city: l.city,
      state: l.state,
      country: normalizeCountryCode(l.country),
      industry: l.industry,
      leadScore: l.leadScore,
    });
  }

  // Persist recovered coords so the next visit and exports stay accurate
  if (backfill.length) {
    await Promise.all(
      backfill.slice(0, 100).map((row) =>
        prisma.lead.update({
          where: { id: row.id },
          data: {
            latitude: row.latitude,
            longitude: row.longitude,
          },
        }),
      ),
    );
  }

  const description =
    geoLeads.length === 0
      ? "No mappable leads yet. Generate leads in Lead Finder to drop pins."
      : unmapped > 0
        ? `${geoLeads.length} pin${geoLeads.length === 1 ? "" : "s"} · ${unmapped} missing coordinates.`
        : `${geoLeads.length} lead pin${geoLeads.length === 1 ? "" : "s"} from your searches.`;

  return (
    <div className="page-pad">
      <PageHeader
        title="Lead Map"
        description={description}
        actions={
          <PrimaryActionLink href="/leads/search">
            <HiOutlineMagnifyingGlass className="h-4 w-4" />
            Generate Leads
          </PrimaryActionLink>
        }
      />

      <LeadGeoMap
        leads={geoLeads}
        title="Lead Map"
        subtitle="Your verified leads by location"
      />
    </div>
  );
}
