"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SetupShell } from "@/components/setup/setup-shell";
import { EmailAutomationSettings } from "@/components/settings/email-automation-settings";
import { EmailMetricsDashboard } from "@/components/email/email-metrics-dashboard";
import { EmailInboxPanel } from "@/components/email/email-inbox-panel";

export default function SetupEmailPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/settings/smtp-accounts")
      .then((r) => r.json())
      .then((d) => {
        setReady(
          Boolean(
            (d.accounts ?? []).some(
              (a: { enabled?: boolean; fromEmail?: string }) =>
                a.enabled && a.fromEmail,
            ),
          ),
        );
      })
      .catch(() => {});
  }, []);

  return (
    <SetupShell
      title="Email & SMTP"
      description="Connect mailboxes, read lead replies in your inbox, and run Day 1–3 nurture sequences."
      statuses={{ "/setup/email": ready }}
      steps={[
        {
          title: "Open Email inbox",
          body: "View and reply to received lead emails anytime.",
        },
        {
          title: "Add an SMTP mailbox",
          body: "Gmail app password, Outlook, or any SMTP host.",
        },
        {
          title: "Send from lead detail",
          body: "Open a lead → Email lead card → pick mailbox → send.",
        },
        {
          title: "Optional: Day 1–3 sequence",
          body: "Edit templates below, then enroll from Saved / detail.",
        },
      ]}
    >
      <div className="rounded-xl border border-border bg-[var(--surface)] px-4 py-3 text-[13px] text-ink-muted">
        Prefer a dedicated page?{" "}
        <Link
          href="/inbox"
          className="font-semibold text-brand-600 hover:underline"
        >
          Open Email inbox →
        </Link>
      </div>

      <EmailInboxPanel />

      <section className="space-y-3 border-t border-border pt-6">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Email dashboard</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Delivered sends, inbound replies, failures, and nurture enrollments.
          </p>
        </div>
        <EmailMetricsDashboard
          endpoint="/api/emails/stats"
          leadHref={(id) => `/leads/${id}?from=saved`}
        />
      </section>

      <div className="border-t border-border pt-6">
        <EmailAutomationSettings />
      </div>
    </SetupShell>
  );
}
