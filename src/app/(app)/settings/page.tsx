import { SettingsForm } from "@/components/settings/settings-form";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad">
      <PageHeader
        title="Settings"
        description="Manage your business profile and preferences used by Ask Expert."
      />
      <SettingsForm user={user} />
    </div>
  );
}
