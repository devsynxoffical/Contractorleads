import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { ExportLeadsButtons } from "@/components/leads/export-leads-buttons";
import { AllLeadsFilters } from "@/components/leads/all-leads-filters";
import { AllLeadsTableBody } from "@/components/leads/all-leads-table-body";
import { HiOutlineFire, HiOutlineMagnifyingGlass } from "react-icons/hi2";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDaysAgo(days: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}

export default async function AllLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    when?: string;
    tier?: string;
    strength?: string;
    category?: string;
    sort?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const when = params.when ?? "all";
  const tier = params.tier ?? "all";
  const strength = params.strength ?? "all";
  const category = params.category ?? "all";
  const sort = params.sort ?? "newest";

  const searchFilter: Prisma.SearchWhereInput = {
    userId: user.id,
  };

  if (when === "today") {
    searchFilter.createdAt = { gte: startOfToday() };
  } else if (when === "week") {
    searchFilter.createdAt = { gte: startOfDaysAgo(7) };
  } else if (when === "month") {
    searchFilter.createdAt = { gte: startOfDaysAgo(30) };
  }

  // Date filters use the search run date — reused pool leads keep an older
  // createdAt, so filtering by lead.createdAt hid most of a fresh scrape.
  const where: Prisma.LeadWhereInput = {
    search: searchFilter,
  };

  if (query) {
    where.OR = [
      { businessName: { contains: query, mode: "insensitive" } },
      { ownerName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
      { state: { contains: query, mode: "insensitive" } },
      { industry: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
    ];
  }

  if (tier === "hot" || tier === "warm" || tier === "nurture") {
    where.qualityTier = tier;
  }

  if (strength === "strong") {
    where.leadScore = { gte: 75 };
  } else if (strength === "medium") {
    where.leadScore = { gte: 50, lt: 75 };
  } else if (strength === "developing") {
    where.leadScore = { lt: 50 };
  }

  if (category && category !== "all") {
    where.industry = { equals: category, mode: "insensitive" };
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput[] =
    sort === "score"
      ? [{ leadScore: "desc" }, { createdAt: "desc" }]
      : sort === "oldest"
        ? [{ search: { createdAt: "asc" } }, { createdAt: "asc" }]
        : [{ search: { createdAt: "desc" } }, { leadScore: "desc" }];

  const [leads, total, categoryRows, savedRows] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      take: 1000,
      include: {
        search: { select: { createdAt: true, industry: true } },
      },
    }),
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where: { search: { userId: user.id }, industry: { not: null } },
      distinct: ["industry"],
      select: { industry: true },
      orderBy: { industry: "asc" },
      take: 100,
    }),
    prisma.savedLead.findMany({
      where: { userId: user.id },
      select: { leadId: true },
    }),
  ]);

  const pipelineLeadIds = savedRows.map((s) => s.leadId);

  const categories = categoryRows
    .map((r) => r.industry)
    .filter((v): v is string => Boolean(v?.trim()))
    .sort((a, b) => a.localeCompare(b));

  const filtersActive =
    Boolean(query) ||
    when !== "all" ||
    tier !== "all" ||
    strength !== "all" ||
    category !== "all";

  return (
    <div className="page-pad">
      <PageHeader
        title="All Leads"
        description={
          filtersActive
            ? `${total} lead${total === 1 ? "" : "s"} match your filters.`
            : `${total} AI-verified leads from your searches.`
        }
        actions={
          <>
            <ExportLeadsButtons scope="all" disabled={!leads.length} />
            <SecondaryActionLink href="/leads/hot">
              <HiOutlineFire className="h-4 w-4" />
              Hot Leads
            </SecondaryActionLink>
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          </>
        }
      />

      <Suspense
        fallback={
          <div className="mb-4 h-36 animate-pulse rounded-xl border border-border bg-white" />
        }
      >
        <AllLeadsFilters categories={categories} />
      </Suspense>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-[var(--shadow-card)]">
        <AllLeadsTableBody
          pipelineLeadIds={pipelineLeadIds}
          leads={leads.map((lead) => ({
            id: lead.id,
            businessName: lead.businessName,
            industry: lead.industry,
            leadScore: lead.leadScore,
            qualityTier: lead.qualityTier,
            foundAt: lead.search?.createdAt ?? lead.createdAt,
          }))}
        />
        {!leads.length && (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">
            {filtersActive ? (
              <>
                No leads match these filters.{" "}
                <Link
                  href="/leads"
                  className="font-semibold text-brand-600"
                >
                  Clear filters
                </Link>
              </>
            ) : (
              <>
                No leads yet.{" "}
                <Link
                  href="/leads/search"
                  className="font-semibold text-brand-600"
                >
                  Run Lead Finder
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
