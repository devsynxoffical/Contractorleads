"use client";

import { useEffect, useState } from "react";
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
      title="Email & SMTP"
      description="Connect one or more mailboxes, then email any lead from their profile or enroll them in Day 1–3 nurture. Replies can land via the inbound webhook."
      statuses={{ "/setup/email": ready }}
      steps={[
        {
          title: "Add an SMTP mailbox",
          body: "Gmail app password, Outlook, or any SMTP host.",
        },
        {
          title: "Test connection",
          body: "Verify before sending live outreach.",
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
      <EmailAutomationSettings />
    </SetupShell>
  );
}
