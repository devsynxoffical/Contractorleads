import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requirePlanFeatureOrRedirect } from "@/lib/plan-access-server";
import { SetupApiClient } from "@/components/setup/setup-api-client";

export default async function SetupApiPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  requirePlanFeatureOrRedirect(user, "api");
  return <SetupApiClient />;
}
