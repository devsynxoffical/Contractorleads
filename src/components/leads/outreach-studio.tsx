"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";

const types = [
  { key: "email", label: "Cold Email" },
  { key: "sms", label: "Cold SMS" },
  { key: "followup", label: "Follow-up" },
  { key: "sales_script", label: "Sales Script" },
] as const;

type OutreachType = (typeof types)[number]["key"];

type SmtpAccount = {
  id: string;
  label: string;
  fromEmail: string;
  isDefault: boolean;
};

function parseEmailContent(raw: string, fallbackSubject: string) {
  const match = raw.match(/^\s*Subject:\s*(.+)\s*$/im);
  if (match) {
    const subject = match[1].trim();
    const body = raw
      .replace(/^\s*Subject:\s*.+\s*\n?/im, "")
      .replace(/^\s*(Body|Message):\s*\n?/im, "")
      .trim();
    return { subject: subject || fallbackSubject, body };
  }
  return { subject: fallbackSubject, body: raw.trim() };
}

function canSendEmail(type: OutreachType | null) {
  return type === "email" || type === "followup";
}

function canSendSms(type: OutreachType | null) {
  return type === "sms" || type === "followup";
}

export function OutreachStudio({
  leadId,
  businessName,
  leadEmail,
  leadPhone,
  canSend = true,
  onSent,
}: {
  leadId: string;
  businessName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  canSend?: boolean;
  onSent?: (channel: "email" | "sms", status?: string) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<OutreachType | null>(null);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState(`Quick intro — ${businessName}`);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [hasMessagingAddon, setHasMessagingAddon] = useState<boolean | null>(
    null,
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  const loadSendMeta = useCallback(async () => {
    if (!canSend) return;
    try {
      const [mailRes, addonRes] = await Promise.all([
        leadEmail
          ? fetch(`/api/leads/${leadId}/send-email`)
          : Promise.resolve(null),
        fetch("/api/billing/messaging-addon"),
      ]);
      if (mailRes) {
        const data = await mailRes.json();
        if (mailRes.ok) {
          const list = (data.accounts as SmtpAccount[] | undefined) ?? [];
          setAccounts(list);
          const def = list.find((a) => a.isDefault) || list[0];
          if (def) setSmtpAccountId(def.id);
        }
      }
      if (addonRes.ok) {
        const data = await addonRes.json();
        setHasMessagingAddon(Boolean(data.active));
      } else {
        setHasMessagingAddon(false);
      }
    } catch {
      /* ignore meta load failures — send will surface errors */
    }
  }, [canSend, leadEmail, leadId]);

  useEffect(() => {
    void loadSendMeta();
  }, [loadSendMeta]);

  async function generate(type: OutreachType) {
    setLoading(type);
    setError("");
    setStatusMsg(null);
    const res = await fetch("/api/ai/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, type }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Generation failed");
      setLoading(null);
      return;
    }
    const raw = String(data.script.content ?? "");
    setActiveType(type);
    if (canSendEmail(type)) {
      const parsed = parseEmailContent(raw, `Quick intro — ${businessName}`);
      setSubject(parsed.subject);
      setContent(parsed.body);
    } else {
      setContent(raw);
    }
    if (typeof data.creditsRemaining === "number") {
      notifyCreditsChanged(data.creditsRemaining);
    }
    setLoading(null);
  }

  async function sendEmail() {
    if (!leadEmail) {
      setError("This lead has no email address.");
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setSendingEmail(true);
    setError("");
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: content.trim(),
          smtpAccountId: smtpAccountId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setStatusMsg("Email sent. Pipeline moved to Contacted if it was New.");
      onSent?.("email", data.status || "contacted");
      await loadSendMeta();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingEmail(false);
    }
  }

  async function sendSms() {
    if (!leadPhone) {
      setError("This lead has no phone number.");
      return;
    }
    if (!content.trim()) {
      setError("Message is required.");
      return;
    }
    setSendingSms(true);
    setError("");
    setStatusMsg(null);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, body: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "messaging_addon_required") {
          setHasMessagingAddon(false);
        }
        throw new Error(data.error || "SMS send failed");
      }
      setStatusMsg(`SMS sent to ${leadPhone}.`);
      setHasMessagingAddon(true);
      onSent?.("sms", data.status || "contacted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "SMS send failed");
    } finally {
      setSendingSms(false);
    }
  }

  const showEmailSend = canSend && canSendEmail(activeType);
  const showSmsSend = canSend && canSendSms(activeType);
  const busy = loading !== null || sendingEmail || sendingSms;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Outreach Studio</CardTitle>
        <p className="text-sm text-ink-muted">
          Personalized outreach for {businessName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Button
              key={t.key}
              variant="secondary"
              size="sm"
              onClick={() => generate(t.key)}
              disabled={busy}
            >
              {loading === t.key ? "Generating…" : t.label}
            </Button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {statusMsg && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
            {statusMsg}
          </p>
        )}
        {content !== "" || activeType ? (
          <div className="space-y-3 rounded-lg border border-border bg-[#FBFAF8] p-4">
            {showEmailSend ? (
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={busy}
                />
              </div>
            ) : null}

            {showEmailSend && accounts.length > 0 ? (
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">Send from</span>
                <select
                  className="saas-input mt-1"
                  value={smtpAccountId}
                  onChange={(e) => setSmtpAccountId(e.target.value)}
                  disabled={busy}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} · {a.fromEmail}
                      {a.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {showEmailSend && leadEmail ? (
              <p className="text-[12px] text-ink-muted">
                To{" "}
                <span className="font-medium text-ink">{leadEmail}</span>
              </p>
            ) : null}

            {showSmsSend && leadPhone ? (
              <p className="text-[12px] text-ink-muted">
                SMS to{" "}
                <span className="font-medium text-ink">{leadPhone}</span>
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                className="min-h-[140px] bg-white"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={busy}
              />
              {showSmsSend ? (
                <p className="text-[11px] text-ink-faint">
                  {content.trim().length} characters
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!content.trim()}
                onClick={() => {
                  const text =
                    showEmailSend && subject.trim()
                      ? `Subject: ${subject.trim()}\n\n${content}`
                      : content;
                  void navigator.clipboard.writeText(text);
                }}
              >
                Copy
              </Button>

              {showEmailSend ? (
                <Button
                  size="sm"
                  loading={sendingEmail}
                  disabled={
                    busy ||
                    !leadEmail ||
                    !accounts.length ||
                    !subject.trim() ||
                    !content.trim()
                  }
                  onClick={() => void sendEmail()}
                >
                  Send email
                </Button>
              ) : null}

              {showSmsSend ? (
                <Button
                  size="sm"
                  loading={sendingSms}
                  disabled={
                    busy ||
                    !leadPhone ||
                    !content.trim() ||
                    hasMessagingAddon === false
                  }
                  onClick={() => void sendSms()}
                >
                  Send SMS
                </Button>
              ) : null}
            </div>

            {showEmailSend && !leadEmail ? (
              <p className="text-[12px] text-amber-800">
                No email on this lead — enrich or add an address before sending.
              </p>
            ) : null}

            {showEmailSend && leadEmail && accounts.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                Add an SMTP mailbox in{" "}
                <Link
                  href="/setup/email"
                  className="font-semibold underline"
                >
                  Settings → Email
                </Link>{" "}
                first.
              </p>
            ) : null}

            {showSmsSend && !leadPhone ? (
              <p className="text-[12px] text-amber-800">
                No phone on this lead — enrich contact details before sending SMS.
              </p>
            ) : null}

            {showSmsSend && hasMessagingAddon === false ? (
              <p className="rounded-xl bg-black/[0.04] px-3 py-2 text-[12px] text-ink-muted">
                SMS requires the{" "}
                <Link
                  href="/billing?addon=messaging"
                  className="font-semibold text-brand-600 underline"
                >
                  Messaging add-on ($15.50/mo)
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
