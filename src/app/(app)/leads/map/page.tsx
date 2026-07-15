import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  PrimaryActionLink,
} from "@/components/layout/page-header";
import { HiOutlineMagnifyingGlass, HiOutlineMapPin } from "react-icons/hi2";

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
  });

  return (
    <div className="page-pad">
      <PageHeader
        title="Lead Map"
        description="Geographic view of your generated leads."
        actions={
          <PrimaryActionLink href="/leads/search">
            <HiOutlineMagnifyingGlass className="h-4 w-4" />
            Generate Leads
          </PrimaryActionLink>
        }
      />

      <Card className="overflow-hidden border-border shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          <div className="flex h-56 flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#faf8fb] to-[#f3eef6] px-6 text-center sm:h-64">
            <HiOutlineMapPin className="h-8 w-8 text-brand-500" />
            <p className="text-sm font-medium text-ink">
              Map preview
            </p>
            <p className="max-w-sm text-[13px] text-ink-muted">
              Coordinates load from Google Places. Interactive map tiles can be
              connected when you add a Maps JavaScript key.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Card
            key={lead.id}
            className="border-border shadow-[var(--shadow-card)] transition hover:border-brand-200"
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-semibold text-ink hover:text-brand-600"
                >
                  {lead.businessName}
                </Link>
                <Badge
                  variant={
                    lead.qualityTier === "hot"
                      ? "hot"
                      : lead.qualityTier === "warm"
                        ? "warm"
                        : "nurture"
                  }
                >
                  {lead.qualityTier ?? "nurture"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{lead.address}</p>
              <p className="mt-2 text-[11px] tabular-nums text-ink-faint">
                {lead.latitude?.toFixed(4)}, {lead.longitude?.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!leads.length && (
        <p className="mt-6 text-center text-sm text-ink-muted">
          Generate leads with Lead Finder to populate the map.
        </p>
      )}
    </div>
  );
}
