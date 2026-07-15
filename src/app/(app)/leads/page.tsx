import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { HiOutlineFire, HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default async function AllLeadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { search: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="page-pad">
      <PageHeader
        title="All Leads"
        description={`${leads.length} AI-verified leads from your searches.`}
        actions={
          <>
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

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border bg-[#faf8fb] text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Tier</th>
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
                <td className="px-4 py-3.5 text-ink-muted">{lead.industry}</td>
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
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/leads/${lead.id}`}
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
            No leads yet.{" "}
            <Link href="/leads/search" className="font-semibold text-brand-600">
              Run Lead Finder
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
