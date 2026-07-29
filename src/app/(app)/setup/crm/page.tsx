import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userHasPlanFeature } from "@/lib/plan-access";
import { SetupCrmClient } from "@/components/setup/setup-crm-client";
import { PlanFeatureGate } from "@/components/billing/plan-feature-gate";

export default async function SetupCrmPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!userHasPlanFeature(user, "crm")) {
    return <PlanFeatureGate feature="crm" currentPlan={user.plan} />;
  }
  return <SetupCrmClient />;
}
