import { LeadDetailView } from "@/components/leads/lead-detail-view";
import AdminLeadEditClient from "./edit-client";

export default async function AdminLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { from, edit } = await searchParams;

  if (edit === "1") {
    return <AdminLeadEditClient from={from} />;
  }

  const source = from === "scrape" ? "scrape" : "all";

  return <LeadDetailView leadId={id} from={source} variant="admin" />;
}
