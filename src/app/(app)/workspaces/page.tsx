import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, PrimaryActionLink } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { requirePlanFeatureOrRedirect } from "@/lib/plan-access-server";

export default async function WorkspacesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  requirePlanFeatureOrRedirect(user, "workspaces");

  const [searches, saved, scripts] = await Promise.all([
    prisma.search.count({ where: { userId: user.id } }),
    prisma.savedLead.count({ where: { userId: user.id } }),
    prisma.script.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="page-pad page-enter space-y-5">
      <PageHeader
        title="Workspaces"
        description="Your agency workspace — profile, credits, and activity at a glance."
        actions={
          <PrimaryActionLink href="/settings">
            <HiOutlineCog6Tooth className="h-4 w-4" />
            Edit settings
          </PrimaryActionLink>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {user.companyName || user.name || "Agency workspace"}
          </CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Plan", v: user.plan },
            { l: "Credits", v: String(Math.round(user.creditsRemaining * 10) / 10) },
            { l: "Owner", v: user.ownerName || user.name || "—" },
            { l: "Status", v: user.subscriptionStatus || "—" },
          ].map((row) => (
            <div
              key={row.l}
              className="rounded-xl border border-border bg-[var(--input-bg)] px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {row.l}
              </p>
              <p className="mt-1 text-[14px] font-semibold capitalize text-ink">
                {row.v}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { l: "Searches", v: searches, href: "/leads/search" },
          { l: "Saved leads", v: saved, href: "/leads/saved" },
          { l: "Scripts", v: scripts, href: "/scripts" },
        ].map((c) => (
          <Link key={c.l} href={c.href}>
            <Card className="transition hover:border-brand-300">
              <CardContent className="py-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {c.l}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                  {c.v}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-2 py-5 text-sm text-ink-muted">
          <p>
            <span className="font-semibold text-ink">Services:</span>{" "}
            {user.services || "Add in Settings"}
          </p>
          <p>
            <span className="font-semibold text-ink">ICP:</span>{" "}
            {user.idealCustomer || "Add in Settings"}
          </p>
          <p>
            <span className="font-semibold text-ink">Areas:</span>{" "}
            {user.serviceAreas || "Add in Settings"}
          </p>
          <p>
            <span className="font-semibold text-ink">Goal:</span>{" "}
            {user.mainGoal || "Add in Settings"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
