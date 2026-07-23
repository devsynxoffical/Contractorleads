import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SecuritySettingsForm } from "@/components/settings/security-settings-form";
import Link from "next/link";

export default async function SecuritySettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Security"
        description="Password and account access for your Contractor Leads workspace."
      />
      <div className="flex flex-wrap gap-2 text-[13px]">
        <Link
          href="/settings"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Business profile
        </Link>
        <Link
          href="/billing"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Billing
        </Link>
        <Link
          href="/team"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Users &amp; teams
        </Link>
      </div>
      <SecuritySettingsForm email={user.email} />
    </div>
  );
}
