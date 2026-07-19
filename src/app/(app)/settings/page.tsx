import { SettingsForm } from "@/components/settings/settings-form";
import { EmailAutomationSettings } from "@/components/settings/email-automation-settings";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-8">
      <PageHeader
        title="Settings"
        description="Business profile, SMTP, and Day 1–3 email automation for scraped leads."
      />
      <SettingsForm user={user} />
      <EmailAutomationSettings />
    </div>
  );
}
