"use client";

import { useEffect, useState } from "react";
import { SetupShell } from "@/components/setup/setup-shell";
import { ApiAccessSettings } from "@/components/settings/api-access-settings";

export default function SetupApiPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/user/api-access")
      .then((r) => r.json())
      .then((d) => {
        setReady(Boolean(d.access?.apiKeyLast4));
      })
      .catch(() => {});
  }, []);

  return (
    <SetupShell
      title="API · MCP · SSO"
      description="One key powers REST search, MCP tools, and SSO-style auth. Generate it here, then call the public endpoints from your CRM or automation."
      statuses={{ "/setup/api": ready }}
      steps={[
        {
          title: "Confirm plan access",
          body: "Growth+ unlocks API/MCP. Agency+ unlocks SSO.",
        },
        {
          title: "Generate API key",
          body: "Copy lf_live_… once — it won’t be shown again.",
        },
        {
          title: "Call the endpoints",
          body: "POST /api/public/leads/search with x-api-key or Bearer.",
        },
      ]}
    >
      <ApiAccessSettings />
    </SetupShell>
  );
}
