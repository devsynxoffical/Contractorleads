import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, PrimaryActionLink } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { requirePlanFeatureOrRedirect } from "@/lib/plan-access-server";

export default async function ClientReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  requirePlanFeatureOrRedirect(user, "reports");

  const saved = await prisma.savedLead.findMany({
    where: { userId: user.id },
    include: { lead: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const byStatus = saved.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const hot = saved.filter((s) => s.lead.qualityTier === "hot").length;
  const avgScore = saved.length
    ? Math.round(
        saved.reduce((n, s) => n + (s.lead.leadScore || 0), 0) / saved.length,
      )
    : 0;

  return (
    <div className="page-pad page-enter space-y-5">
      <PageHeader
        title="Client Reports"
        description="Pipeline snapshot you can share with clients — based on your saved CRM leads."
        actions={
          <PrimaryActionLink href="/leads/saved">
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Export from Saved
          </PrimaryActionLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Leads in report", v: saved.length },
          { l: "Hot", v: hot },
          { l: "Avg score", v: avgScore },
          { l: "Closed", v: byStatus.closed || 0 },
        ].map((c) => (
          <Card key={c.l}>
            <CardContent className="py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {c.l}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                {c.v}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {user.companyName || "Agency"} · pipeline report
          </CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Generated for {user.name || user.email} · {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
            >
              <span className="capitalize text-ink">{status}</span>
              <span className="tabular-nums font-semibold text-ink">{count}</span>
            </div>
          ))}
          {!saved.length && (
            <p className="text-sm text-ink-muted">
              Save leads from Lead Finder to build a client report.{" "}
              <Link href="/leads/search" className="font-semibold text-brand-600">
                Search now →
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {saved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lead roster (latest 100)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {saved.slice(0, 25).map((s) => (
              <Link
                key={s.id}
                href={`/leads/${s.lead.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 transition hover:border-brand-300"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {s.lead.businessName}
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    {[s.lead.city, s.lead.state, s.lead.industry]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    s.lead.qualityTier === "hot"
                      ? "hot"
                      : s.lead.qualityTier === "warm"
                        ? "warm"
                        : "nurture"
                  }>
                    {s.lead.qualityTier || "n/a"}
                  </Badge>
                  <span className="text-[12px] font-semibold tabular-nums text-brand-600">
                    {s.lead.leadScore}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
