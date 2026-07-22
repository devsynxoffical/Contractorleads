import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { ExportLeadsButtons } from "@/components/leads/export-leads-buttons";
import { AllLeadsFilters } from "@/components/leads/all-leads-filters";
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

  const where: Prisma.LeadWhereInput = {
    search: { userId: user.id },
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

  if (when === "today") {
    where.createdAt = { gte: startOfToday() };
  } else if (when === "week") {
    where.createdAt = { gte: startOfDaysAgo(7) };
  } else if (when === "month") {
    where.createdAt = { gte: startOfDaysAgo(30) };
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

  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sort === "score"
      ? { leadScore: "desc" }
      : sort === "oldest"
        ? { createdAt: "asc" }
        : { createdAt: "desc" };

  const [leads, categoryRows] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      take: 200,
    }),
    prisma.lead.findMany({
      where: { search: { userId: user.id }, industry: { not: null } },
      distinct: ["industry"],
      select: { industry: true },
      orderBy: { industry: "asc" },
      take: 100,
    }),
  ]);

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
            ? `${leads.length} lead${leads.length === 1 ? "" : "s"} match your filters.`
            : `${leads.length} AI-verified leads from your searches.`
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
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-[#faf8fb] text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-border last:border-0 hover:bg-brand-50/40"
              >
                <td className="px-4 py-3.5 font-medium text-ink">
                  {lead.businessName}
                </td>
                <td className="px-4 py-3.5 text-ink-muted">
                  {lead.industry ?? "—"}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-medium">
                  {lead.leadScore}
                </td>
                <td className="px-4 py-3.5">
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
                </td>
                <td className="px-4 py-3.5 text-[12px] tabular-nums text-ink-muted">
                  {lead.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/leads/${lead.id}?from=all`}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
