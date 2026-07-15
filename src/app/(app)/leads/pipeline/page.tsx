import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LEAD_STATUSES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { HiOutlineMagnifyingGlass, HiOutlineStar } from "react-icons/hi2";

export default async function PipelinePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const saved = await prisma.savedLead.findMany({
    where: { userId: user.id },
    include: { lead: true },
    orderBy: { updatedAt: "desc" },
  });

  const columns = LEAD_STATUSES.map((status) => ({
    ...status,
    items: saved.filter((s) => s.status === status.value),
  }));

  return (
    <div className="page-pad">
      <PageHeader
        title="Pipeline CRM"
        description="Track saved leads: New → Contacted → Qualified → Closed."
        actions={
          <>
            <SecondaryActionLink href="/leads/saved">
              <HiOutlineStar className="h-4 w-4" />
              Saved Leads
            </SecondaryActionLink>
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          </>
        }
      />

      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.value}
            className="w-[240px] shrink-0 rounded-xl border border-border bg-[#faf8fb] p-3 sm:w-[260px]"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink">{col.label}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-600 shadow-sm">
                {col.items.length}
              </span>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 sm:max-h-none">
              {col.items.map((s) => (
                <Card
                  key={s.id}
                  className="border-border shadow-sm transition hover:border-brand-200"
                >
                  <CardContent className="py-3">
                    <Link
                      href={`/leads/${s.lead.id}`}
                      className="font-semibold text-ink hover:text-brand-600"
                    >
                      {s.lead.businessName}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                      {s.lead.address}
                    </p>
                    <p className="mt-2 text-xs font-semibold tabular-nums text-brand-600">
                      Score {s.lead.leadScore}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {!col.items.length && (
                <p className="rounded-lg border border-dashed border-border bg-white px-3 py-6 text-center text-xs text-ink-faint">
                  No leads
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
