import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { userHasPlanFeature } from "@/lib/plan-access";
import { ClientReportsView } from "@/components/reports/client-reports-view";
import { PlanFeatureGate } from "@/components/billing/plan-feature-gate";

export default async function ClientReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!userHasPlanFeature(user, "reports")) {
    return <PlanFeatureGate feature="reports" currentPlan={user.plan} />;
  }

  return <ClientReportsView initial={null} />;
}
