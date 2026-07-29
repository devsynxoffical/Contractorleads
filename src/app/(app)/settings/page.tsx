import { SettingsForm } from "@/components/settings/settings-form";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="All settings"
        description="Business profile powers outreach and your AI Assistant. Use the links below for team, billing, security, and integrations."
        backHref="/dashboard"
        backLabel="Back to dashboard"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />
      <div className="flex flex-wrap gap-2 text-[13px]">
        <Link
          href="/settings/security"
          className="rounded-xl border border-slate-200 bg-[var(--surface)] px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Security
        </Link>
        <Link
          href="/billing"
          className="rounded-xl border border-slate-200 bg-[var(--surface)] px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Billing and plan usage
        </Link>
        <Link
          href="/team"
          className="rounded-xl border border-slate-200 bg-[var(--surface)] px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Users &amp; teams
        </Link>
        <Link
          href="/setup"
          className="rounded-xl border border-slate-200 bg-[var(--surface)] px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Integrations setup
        </Link>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
