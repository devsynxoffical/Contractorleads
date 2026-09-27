import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignDetailView } from "@/components/campaigns/campaign-detail-view";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <div className="page-pad space-y-6">
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading campaign performance…</p>}>
        <CampaignDetailView campaignId={id} />
      </Suspense>
    </div>
  );
}
