import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { QualificationDetailView } from "@/components/leads/qualification-detail-view";
import { isQualificationScoreKey } from "@/lib/services/qualification-detail-report-meta";
import { leadDetailHref, parseLeadFrom } from "@/lib/nav-context";

export default async function LeadQualificationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; scoreKey: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id, scoreKey } = await params;
  const { from: fromRaw } = await searchParams;
  const from = parseLeadFrom(fromRaw);

  if (!isQualificationScoreKey(scoreKey)) {
    redirect(leadDetailHref(id, from));
  }

  return (
    <QualificationDetailView
      leadId={id}
      scoreKey={scoreKey}
      backHref={leadDetailHref(id, from)}
      from={from}
      basePath={`/leads/${id}/qualification`}
    />
  );
}
