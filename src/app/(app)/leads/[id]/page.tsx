import { LeadDetailView } from "@/components/leads/lead-detail-view";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const source =
    from === "hot" || from === "saved" || from === "all" ? from : "all";

  return <LeadDetailView leadId={id} from={source} />;
}
