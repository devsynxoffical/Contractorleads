import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requirePlanFeatureOrRedirect } from "@/lib/plan-access";
import { SetupCrmClient } from "@/components/setup/setup-crm-client";

export default async function SetupCrmPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  requirePlanFeatureOrRedirect(user, "crm");
  return <SetupCrmClient />;
}
