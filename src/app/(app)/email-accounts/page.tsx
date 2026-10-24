import { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailAccountsList } from "@/components/email-accounts/email-accounts-list";

export const metadata: Metadata = {
  title: "Email Accounts & Mailbox Warmup | Contractor Leads",
  description:
    "Manage and warm up 65+ sending mailboxes, verify SPF, DKIM, DMARC, and MX DNS authentication, and monitor deliverability health before outreach campaigns.",
};

export default async function EmailAccountsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border dark:border-[#26253c]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-ink dark:text-white tracking-tight">
              Email Accounts & Mailbox Warmup
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Infrastructure Layer
            </span>
          </div>
          <p className="text-xs text-ink-muted dark:text-slate-400 mt-1 max-w-2xl">
            Centralized sending infrastructure for all 65 system mailboxes and connected custom accounts.
            Warmed up 24/7 with automated spam-rescue and real-time SPF, DKIM, DMARC, and MX compliance checks.
          </p>
        </div>
      </div>

      {/* Main Table & Tools */}
      <EmailAccountsList />
    </div>
  );
}
