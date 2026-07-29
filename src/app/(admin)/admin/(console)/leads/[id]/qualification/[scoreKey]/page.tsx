import { redirect } from "next/navigation";
import { getSessionUser, isAdminStaff } from "@/lib/auth";
import { QualificationDetailView } from "@/components/leads/qualification-detail-view";
import { isQualificationScoreKey } from "@/lib/services/qualification-detail-report-meta";

export default async function AdminLeadQualificationDetailPage({
  params,
}: {
  params: Promise<{ id: string; scoreKey: string }>;
}) {
  const user = await getSessionUser();
  if (!user || !isAdminStaff(user)) redirect("/login");

  const { id, scoreKey } = await params;
  if (!isQualificationScoreKey(scoreKey)) {
    redirect(`/admin/leads/${id}`);
  }

  return (
    <QualificationDetailView
      leadId={id}
      scoreKey={scoreKey}
      backHref={`/admin/leads/${id}`}
      basePath={`/admin/leads/${id}/qualification`}
    />
  );
}
