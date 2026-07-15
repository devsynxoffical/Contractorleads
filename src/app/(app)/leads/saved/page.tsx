import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { HiOutlineMagnifyingGlass, HiOutlineViewColumns } from "react-icons/hi2";

export default async function SavedLeadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const saved = await prisma.savedLead.findMany({
    where: { userId: user.id },
    include: { lead: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="page-pad">
      <PageHeader
        title="Saved Leads"
        description={`${saved.length} leads in your workspace.`}
        actions={
          <>
            <SecondaryActionLink href="/leads/pipeline">
              <HiOutlineViewColumns className="h-4 w-4" />
              Pipeline
            </SecondaryActionLink>
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          </>
        }
      />

      <div className="grid gap-3">
        {saved.map((s) => (
          <Card
            key={s.id}
            className="border-border shadow-[var(--shadow-card)] transition hover:border-brand-200"
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link
                  href={`/leads/${s.lead.id}`}
                  className="font-semibold text-ink hover:text-brand-600"
                >
                  {s.lead.businessName}
                </Link>
                <p className="mt-1 text-sm text-ink-muted">{s.lead.address}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{s.status}</Badge>
                {s.favorite && <Badge variant="brand">Favorite</Badge>}
                <span className="text-sm font-semibold tabular-nums text-brand-600">
                  Score {s.lead.leadScore}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!saved.length && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-ink-muted">
              No saved leads yet. Run a search and save your best matches.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
