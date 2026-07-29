import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userHasPlanFeature } from "@/lib/plan-access";
import { SetupApiClient } from "@/components/setup/setup-api-client";
import { PlanFeatureGate } from "@/components/billing/plan-feature-gate";

export default async function SetupApiPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!userHasPlanFeature(user, "api")) {
    return <PlanFeatureGate feature="api" currentPlan={user.plan} />;
  }
  return <SetupApiClient />;
}
