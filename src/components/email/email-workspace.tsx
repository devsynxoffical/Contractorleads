"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailInboxPanel } from "@/components/email/email-inbox-panel";
import { EmailComposePanel } from "@/components/email/email-compose-panel";
import { EmailBulkPanel } from "@/components/email/email-bulk-panel";
import {
  EmailOverviewPanel,
  type EmailHubTab,
} from "@/components/email/email-overview-panel";
import { EmailMetricsDashboard } from "@/components/email/email-metrics-dashboard";
import { EmailAutomationSettings } from "@/components/settings/email-automation-settings";
import { cn } from "@/lib/utils";
import {
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineHome,
  HiOutlineInbox,
  HiOutlinePencilSquare,
  HiOutlineQueueList,
  HiOutlineUsers,
} from "react-icons/hi2";

const TABS: Array<{
  id: EmailHubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Overview", icon: HiOutlineHome },
  { id: "inbox", label: "Inbox", icon: HiOutlineInbox },
  { id: "compose", label: "Compose", icon: HiOutlinePencilSquare },
  { id: "bulk", label: "Bulk send", icon: HiOutlineUsers },
  { id: "setup", label: "Setup email", icon: HiOutlineCog6Tooth },
  { id: "sequences", label: "Sequences", icon: HiOutlineQueueList },
  { id: "activity", label: "Activity", icon: HiOutlineChartBar },
];

const VALID = new Set<EmailHubTab>(TABS.map((t) => t.id));

export function EmailWorkspace({
  smtpReady,
  hasAddon,
}: {
  smtpReady: boolean;
  hasAddon: boolean;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<EmailHubTab>("overview");

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw && VALID.has(raw as EmailHubTab)) {
      setTab(raw as EmailHubTab);
    }
  }, [searchParams]);

  function go(next: EmailHubTab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-[var(--surface)] p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition sm:text-[13px]",
                selected
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <EmailOverviewPanel
          smtpReady={smtpReady}
          hasAddon={hasAddon}
          onGo={go}
        />
      ) : null}

      {tab === "inbox" ? <EmailInboxPanel /> : null}

      {tab === "compose" ? (
        <div className="space-y-3">
          {!smtpReady ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
              Connect a mailbox first.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => go("setup")}
              >
                Setup email
              </button>
            </div>
          ) : null}
          <EmailComposePanel />
        </div>
      ) : null}

      {tab === "bulk" ? (
        <EmailBulkPanel
          hasAddon={hasAddon}
          smtpReady={smtpReady}
          onNeedSetup={() => go("setup")}
        />
      ) : null}

      {tab === "setup" || tab === "sequences" ? (
        <div className="space-y-4">
          {tab === "setup" ? (
            <div className="rounded-2xl border border-border bg-[#faf8fc]/70 px-4 py-3 text-[13px] text-ink-muted">
              Add Resend (recommended) or SMTP mailboxes, set a default sender,
              and test delivery. Nurture templates are under{" "}
              <button
                type="button"
                className="font-semibold text-brand-700 underline"
                onClick={() => go("sequences")}
              >
                Sequences
              </button>
              .
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-[#faf8fc]/70 px-4 py-3 text-[13px] text-ink-muted">
              Edit Day 1–N nurture steps below. Enroll leads from Saved leads or
              the lead detail page after templates are ready.
            </div>
          )}
          <EmailAutomationSettings />
        </div>
      ) : null}

      {tab === "activity" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Email activity</h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Delivered sends, inbound replies, failures, and nurture
              enrollments.
            </p>
          </div>
          <EmailMetricsDashboard
            endpoint="/api/emails/stats"
            leadHref={(id) => `/leads/${id}?from=saved`}
          />
        </section>
      ) : null}
    </div>
  );
}
