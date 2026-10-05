import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { parseLeadFrom } from "@/lib/nav-context";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; segmentId?: string }>;
}) {
  const { id } = await params;
  const { from, segmentId } = await searchParams;

  return (
    <LeadDetailView
      leadId={id}
      from={parseLeadFrom(from)}
      segmentId={segmentId}
    />
  );
}
