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
  const [copied, setCopied] = useState(false);

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

  async function copyKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg("Could not copy — select the key manually.");
    }
  }

  const pct = data?.access.apiMonthlyLimit
    ? Math.min(
        100,
        Math.round((data.access.apiMonthlyUsed / data.access.apiMonthlyLimit) * 100),
      )
    : 0;

  const keyForExample = apiKey || "YOUR_API_KEY";
  const curlExample = `curl -X POST "${typeof window !== "undefined" ? window.location.origin : ""}/api/public/leads/search" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keyForExample}" \\
  -d '{"industry":"Roofing","country":"US","state":"TX","city":"Austin","targetLeadCount":10}'`;

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>API, MCP & SSO access</CardTitle>
        <p className="text-[13px] text-ink-muted">
          Same key works for API, MCP, and SSO. Auth with{" "}
          <code className="text-[12px]">x-api-key</code>,{" "}
          <code className="text-[12px]">Authorization: Bearer</code>, or{" "}
          <code className="text-[12px]">x-sso-token</code>.
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
                <span
                  className={
                    data.planFeatures.api && data.access.apiEnabled
                      ? "font-semibold text-brand-700"
                      : "text-ink-muted"
                  }
                >
                  {data.planFeatures.api
                    ? data.access.apiEnabled
                      ? "Enabled"
                      : "Disabled by admin"
                    : "Not in your plan"}
                </span>
              </p>
              <p className="rounded-xl bg-[#faf8fc] px-3 py-2">
                MCP:{" "}
                <span
                  className={
                    data.planFeatures.mcp && data.access.mcpEnabled
                      ? "font-semibold text-brand-700"
                      : "text-ink-muted"
                  }
                >
                  {data.planFeatures.mcp
                    ? data.access.mcpEnabled
                      ? "Enabled"
                      : "Disabled by admin"
                    : "Not in your plan"}
                </span>
              </p>
              <p className="rounded-xl bg-[#faf8fc] px-3 py-2">
                SSO:{" "}
                <span
                  className={
                    data.planFeatures.sso && data.access.ssoEnabled
                      ? "font-semibold text-brand-700"
                      : "text-ink-muted"
                  }
                >
                  {data.planFeatures.sso
                    ? data.access.ssoEnabled
                      ? "Enabled"
                      : "Disabled by admin"
                    : "Not in your plan"}
                </span>
              </p>
            </div>

            {!data.planFeatures.api &&
            !data.planFeatures.mcp &&
            !data.planFeatures.sso ? (
              <p className="text-[12px] text-ink-muted">
                Upgrade to Starter or higher to unlock API / MCP access (SSO on Pro &amp;
                Agency).
              </p>
            ) : !(
                (data.planFeatures.api && data.access.apiEnabled) ||
                (data.planFeatures.mcp && data.access.mcpEnabled) ||
                (data.planFeatures.sso && data.access.ssoEnabled)
              ) ? (
              <p className="text-[12px] text-ink-muted">
                Your plan includes these features, but an admin turned them off. Re-enable
                under Admin → Customers → SSO, API &amp; MCP.
              </p>
            ) : null}

            <p className="text-[13px] text-ink-muted">
              API key:{" "}
              {data.access.apiKeyLast4
                ? `••••${data.access.apiKeyLast4}`
                : "Not generated — click Regenerate"}
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
              <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[12px] text-brand-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span>New key:</span>
                  <code className="break-all">{apiKey}</code>
                  <Button type="button" variant="secondary" onClick={copyKey}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
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
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-[#faf8fc] p-3 text-[12px] text-ink-muted">
              <p className="font-semibold text-ink">Endpoints (POST to search, GET to verify auth)</p>
              <p>
                API: <code className="text-ink">/api/public/leads/search</code>
              </p>
              <p>
                MCP: <code className="text-ink">/api/public/mcp/search</code>
              </p>
              <p>
                SSO: <code className="text-ink">/api/public/sso/leads/search</code>
              </p>
              <p className="pt-1 font-semibold text-ink">Example</p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[11px] text-ink">
                {curlExample}
              </pre>
              <p>
                SSO tip: use <code className="text-ink">Authorization: Bearer YOUR_API_KEY</code>{" "}
                or <code className="text-ink">x-sso-token: YOUR_API_KEY</code> — same key as API.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
