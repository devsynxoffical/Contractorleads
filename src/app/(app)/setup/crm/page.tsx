"use client";

import { useEffect, useState } from "react";
import { SetupShell } from "@/components/setup/setup-shell";
import { CrmWebhooksForm } from "@/components/setup/crm-webhooks-form";

export default function SetupCrmPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/settings/crm-webhook")
      .then((r) => r.json())
      .then((d) => {
        setReady(
          Boolean(
            (d.webhook?.enabled && d.webhook?.url) ||
              (d.slack?.enabled && d.slack?.url) ||
              (d.ghl?.enabled && d.ghl?.url),
          ),
        );
      })
      .catch(() => {});
  }, []);

  return (
    <SetupShell
      title="CRM webhooks"
      description="Push lead.saved and pipeline stage changes to Slack, GoHighLevel, Zapier, Make, or HubSpot the moment they happen."
      statuses={{ "/setup/crm": ready }}
      steps={[
        {
          title: "Paste webhook URL",
          body: "Zapier Catch Hook, Slack incoming, or GHL workflow URL.",
        },
        {
          title: "Enable & save",
          body: "Toggle delivery on for each destination.",
        },
        {
          title: "Send a test ping",
          body: "Confirm your CRM receives the sample payload.",
        },
      ]}
    >
      <CrmWebhooksForm />
    </SetupShell>
  );
}
