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
        title="Business profile"
        description="Company details used in outreach and reports. Email, API, and CRM each have their own setup pages."
      />
      <div className="flex flex-wrap gap-2 text-[13px]">
        <Link
          href="/setup"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Workspace setup hub
        </Link>
        <Link
          href="/setup/email"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          Email & SMTP
        </Link>
        <Link
          href="/setup/api"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          API · MCP · SSO
        </Link>
        <Link
          href="/setup/crm"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 hover:border-slate-300"
        >
          CRM webhooks
        </Link>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
