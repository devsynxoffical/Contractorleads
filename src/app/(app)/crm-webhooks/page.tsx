"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function CrmWebhooksPage() {
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings/crm-webhook")
      .then((r) => r.json())
      .then((d) => {
        if (d.webhook) {
          setUrl(d.webhook.url || "");
          setSecret(d.webhook.secret || "");
          setEnabled(Boolean(d.webhook.enabled));
        }
      })
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/crm-webhook", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret, enabled }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Webhook saved" : data.error || "Save failed");
  }

  async function testPing() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/crm-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? data.message : data.error || "Test failed");
  }

  return (
    <div className="page-pad page-enter space-y-5">
      <PageHeader
        title="CRM Webhooks"
        description="Push lead events to Zapier, Make, HubSpot, or your own endpoint."
      />

      {msg ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-[13px] text-brand-800">
          {msg}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Outbound webhook</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            We POST JSON with header <code className="text-[12px]">X-LeadFlow-Secret</code> when a
            secret is set. Use the test ping to verify delivery.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Shared secret (optional)</Label>
              <Input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Signing secret"
              />
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink-muted">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enable webhook delivery
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                Save webhook
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !url}
                onClick={testPing}
              >
                Send test ping
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payload example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border border-border bg-[var(--input-bg)] p-4 text-[12px] text-ink">
{`{
  "event": "leadflow.test",
  "sentAt": "2026-07-19T10:00:00.000Z",
  "agency": "Your Agency",
  "sample": {
    "businessName": "Acme Roofing Co",
    "phone": "+1 555 0100",
    "qualityTier": "hot",
    "leadScore": 88
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
