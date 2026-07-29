import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PrimaryActionLink,
} from "@/components/layout/page-header";
import { ExportLeadsButtons } from "@/components/leads/export-leads-buttons";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default async function HotLeadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: {
      qualityTier: "hot",
      search: { userId: user.id },
    },
    orderBy: { leadScore: "desc" },
    take: 50,
  });

  return (
    <div className="page-pad">
      <PageHeader
        title="Hot Leads"
        description="Highest-scoring verified leads from your searches. Viewing is free — credits are used only when you export."
        backHref="/dashboard"
        backLabel="Back to dashboard"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Hot leads" },
        ]}
        actions={
          <>
            <ExportLeadsButtons scope="hot" disabled={!leads.length} />
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          </>
        }
      />

      <div className="grid gap-3">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}?from=hot`}
            className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <Card className="border-border shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:bg-brand-50/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{lead.businessName}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {lead.address ||
                      [lead.city, lead.state].filter(Boolean).join(", ") ||
                      "Location pending"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="hot">Hot</Badge>
                  <span className="text-sm font-semibold tabular-nums text-brand-600">
                    Score {lead.leadScore}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!leads.length && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-ink-muted">
              No hot leads yet. Generate leads to see top matches here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
