import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignsDashboard } from "@/components/campaigns/campaigns-dashboard";

export default async function CampaignsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Email Outreach Campaigns"
        description="Launch multi-hook Day 0 outreach, automated follow-up sequences, and track real-time open and reply conversions across 25 mailboxes."
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Email", href: "/inbox" },
          { label: "Campaigns" },
        ]}
      />

      <Suspense fallback={<p className="text-sm text-ink-muted">Loading campaigns…</p>}>
        <CampaignsDashboard />
      </Suspense>
    </div>
  );
}
