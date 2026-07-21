"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ApiAccessData = {
  plan: string;
  planFeatures: { api: boolean; mcp: boolean; sso: boolean };
  access: {
    apiEnabled: boolean;
    mcpEnabled: boolean;
    ssoEnabled: boolean;
    apiKeyLast4: string | null;
    apiMonthlyUsed: number;
    apiMonthlyLimit: number;
    apiUsageResetAt: string | null;
  };
};

export function ApiAccessSettings() {
  const [data, setData] = useState<ApiAccessData | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/user/api-access");
    const body = await res.json();
    if (!res.ok) {
      setMsg(body.error ?? "Could not load API access");
      return;
    }
    setData(body);
  }

  useEffect(() => {
    void load();
  }, []);

  async function regenerateKey() {
    setBusy(true);
    setMsg(null);
    setApiKey(null);
    const res = await fetch("/api/user/api-access", { method: "POST" });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Could not generate API key");
      return;
    }
    setApiKey(body.apiKey ?? null);
    setMsg("New API key generated. Copy it now; it won't be shown again.");
    await load();
  }

  const pct = data?.access.apiMonthlyLimit
    ? Math.min(
        100,
        Math.round((data.access.apiMonthlyUsed / data.access.apiMonthlyLimit) * 100),
      )
    : 0;

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>API, MCP & SSO access</CardTitle>
        <p className="text-[13px] text-ink-muted">
          Connect your own model/tooling through API or MCP (subject to plan limits).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {msg ? (
          <p className="rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-[13px] text-brand-800">
            {msg}
          </p>
        ) : null}

        {!data ? (
          <p className="text-[13px] text-ink-muted">Loading integration access…</p>
        ) : (
          <>
            <div className="grid gap-2 text-[13px] sm:grid-cols-3">
              <p className="rounded-xl bg-[#faf8fc] px-3 py-2">
                API:{" "}
                {data.planFeatures.api
                  ? data.access.apiEnabled
                    ? "Enabled"
                    : "Disabled by admin"
                  : "Not in your plan"}
              </p>
              <p className="rounded-xl bg-[#faf8fc] px-3 py-2">
                MCP:{" "}
                {data.planFeatures.mcp
                  ? data.access.mcpEnabled
                    ? "Enabled"
                    : "Disabled by admin"
                  : "Not in your plan"}
              </p>
              <p className="rounded-xl bg-[#faf8fc] px-3 py-2">
                SSO:{" "}
                {data.planFeatures.sso
                  ? data.access.ssoEnabled
                    ? "Enabled"
                    : "Disabled by admin"
                  : "Not in your plan"}
              </p>
            </div>

            <p className="text-[13px] text-ink-muted">
              API key: {data.access.apiKeyLast4 ? `••••${data.access.apiKeyLast4}` : "Not generated"}
            </p>

            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-[#ece6f7]">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[12px] text-ink-muted">
                {data.access.apiMonthlyUsed} / {data.access.apiMonthlyLimit} calls this month
                {data.access.apiUsageResetAt
                  ? ` · reset ${new Date(data.access.apiUsageResetAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>

            {apiKey ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[12px] text-brand-900">
                New key: <code>{apiKey}</code>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={
                  busy ||
                  !(
                    (data.planFeatures.api && data.access.apiEnabled) ||
                    (data.planFeatures.mcp && data.access.mcpEnabled) ||
                    (data.planFeatures.sso && data.access.ssoEnabled)
                  )
                }
                onClick={regenerateKey}
              >
                Regenerate API key
              </Button>
              <span className="inline-flex items-center rounded-xl bg-[#faf8fc] px-3 text-[12px] text-ink-muted">
                API endpoint: `/api/public/leads/search`
              </span>
              <span className="inline-flex items-center rounded-xl bg-[#faf8fc] px-3 text-[12px] text-ink-muted">
                MCP endpoint: `/api/public/mcp/search`
              </span>
              <span className="inline-flex items-center rounded-xl bg-[#faf8fc] px-3 text-[12px] text-ink-muted">
                SSO endpoint: `/api/public/sso/leads/search` (Bearer or x-sso-token)
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
