"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SetupShell } from "@/components/setup/setup-shell";
import { EmailAutomationSettings } from "@/components/settings/email-automation-settings";

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
      title="Email & outreach"
      description="Connect your sender mailbox here, or use the full Email workspace for inbox, compose, bulk send, sequences, and activity."
      statuses={{ "/setup/email": ready }}
      steps={[
        {
          title: "Open the Email workspace",
          body: "Overview, inbox, compose, bulk send, setup, sequences, and activity in one place.",
        },
        {
          title: "Add your email sender",
          body: "Resend API key + from address on your verified domain (or SMTP).",
        },
        {
          title: "Send to leads",
          body: "Compose to any saved lead, or bulk send with the Messaging add-on.",
        },
        {
          title: "Optional: Day 1–N sequence",
          body: "Edit templates below, then enroll from Saved / lead detail.",
        },
      ]}
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-[var(--surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[14px] font-semibold text-ink">Email workspace</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Manage everything — setup, single send, bulk campaigns, inbox, and
            metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/inbox"
            className="inline-flex h-9 items-center rounded-xl bg-brand-600 px-3.5 text-[13px] font-semibold text-white"
          >
            Open Email →
          </Link>
          <Link
            href="/inbox?tab=bulk"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-[var(--surface)] px-3.5 text-[13px] font-semibold text-ink"
          >
            Bulk send
          </Link>
          <Link
            href="/inbox?tab=compose"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-[var(--surface)] px-3.5 text-[13px] font-semibold text-ink"
          >
            Compose
          </Link>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <EmailAutomationSettings />
      </div>
    </SetupShell>
  );
}
