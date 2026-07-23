import { SettingsForm } from "@/components/settings/settings-form";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { userHasPlanFeature } from "@/lib/plan-access";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="All settings"
        description="Business profile for outreach. Use Workspace settings for team, billing, security, and integrations."
      />
      <div className="flex flex-wrap gap-2 text-[13px]">
        <Link
          href="/settings/security"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Security
        </Link>
        <Link
          href="/billing"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Billing and plan usage
        </Link>
        <Link
          href={userHasPlanFeature(user, "teams") ? "/team" : "/billing"}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Users &amp; teams
        </Link>
        <Link
          href="/setup"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Integrations setup
        </Link>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
