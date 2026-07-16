import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  PageHeader,
  PrimaryActionLink,
} from "@/components/layout/page-header";
import { LeadGeoMap } from "@/components/leads/lead-geo-map";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default async function LeadMapPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: {
      search: { userId: user.id },
      latitude: { not: null },
      longitude: { not: null },
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const geoLeads = leads
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => ({
      id: l.id,
      businessName: l.businessName,
      address: l.address,
      latitude: l.latitude as number,
      longitude: l.longitude as number,
      qualityTier: l.qualityTier,
      googleMapsLink: l.googleMapsLink,
    }));

  return (
    <div className="page-pad">
      <PageHeader
        title="Lead Map"
        description="Geographic plot of leads with coordinates from Google Places."
        actions={
          <PrimaryActionLink href="/leads/search">
            <HiOutlineMagnifyingGlass className="h-4 w-4" />
            Generate Leads
          </PrimaryActionLink>
        }
      />

      <LeadGeoMap leads={geoLeads} />
    </div>
  );
}
