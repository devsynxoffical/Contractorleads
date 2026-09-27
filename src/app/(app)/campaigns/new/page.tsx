import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignWizard } from "@/components/campaigns/campaign-wizard";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ segmentId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { segmentId } = await searchParams;

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Create Email Outreach Campaign"
        description="Build an automated multi-hook outreach series with 6–7 follow-ups, mailbox rotation, and local timezone scheduling."
        backHref="/campaigns"
        backLabel="Back to campaigns"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Campaigns", href: "/campaigns" },
          { label: "New Campaign" },
        ]}
      />

      <Suspense fallback={<p className="text-sm text-ink-muted">Loading wizard…</p>}>
        <CampaignWizard initialSegmentId={segmentId} />
      </Suspense>
    </div>
  );
}
