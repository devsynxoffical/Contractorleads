import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { QualificationDetailView } from "@/components/leads/qualification-detail-view";
import {
  isQualificationScoreKey,
} from "@/lib/services/qualification-detail-report";

export default async function LeadQualificationDetailPage({
  params,
}: {
  params: Promise<{ id: string; scoreKey: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id, scoreKey } = await params;
  if (!isQualificationScoreKey(scoreKey)) {
    redirect(`/leads/${id}`);
  }

  return (
    <QualificationDetailView
      leadId={id}
      scoreKey={scoreKey}
      backHref={`/leads/${id}`}
      basePath={`/leads/${id}/qualification`}
    />
  );
}
