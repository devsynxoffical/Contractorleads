"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

type SmtpAccount = {
  id: string;
  label: string;
  fromEmail: string;
  isDefault: boolean;
};

type LeadMail = {
  id: string;
  direction: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  createdAt: string;
};

export function LeadSendEmailCard({
  leadId,
  leadEmail,
  businessName,
  ownerName,
  onSent,
}: {
  leadId: string;
  leadEmail: string | null | undefined;
  businessName: string;
  ownerName?: string | null;
  onSent?: (status: string) => void;
}) {
  const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
  const [emails, setEmails] = useState<LeadMail[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [subject, setSubject] = useState(`Quick intro — ${businessName}`);
  const [body, setBody] = useState(
    `Hi ${ownerName || "there"},\n\nI came across ${businessName} and thought we might be able to help with more booked jobs.\n\nOpen to a quick chat?\n`,
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/leads/${leadId}/send-email`);
    const data = await res.json();
    if (!res.ok) return;
    setEmails(data.emails ?? []);
    setAccounts(data.accounts ?? []);
    const def =
      (data.accounts as SmtpAccount[] | undefined)?.find((a) => a.isDefault) ||
      data.accounts?.[0];
    if (def) setSmtpAccountId(def.id);
  }

  useEffect(() => {
    void load();
  }, [leadId]);

  async function send() {
    if (!leadEmail) {
      setMsg("This lead has no email address.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/leads/${leadId}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        body,
        smtpAccountId: smtpAccountId || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Send failed");
      return;
    }
    setMsg("Email sent. Pipeline moved to Contacted if it was New.");
    onSent?.(data.status || "contacted");
    await load();
  }

  if (!leadEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email lead</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-ink-muted">
            No email on this lead — enrich or add an address before sending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email lead</CardTitle>
        <p className="text-[12px] text-ink-muted">
          Send from your SMTP mailbox to <span className="font-medium text-ink">{leadEmail}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {msg && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
            {msg}
          </p>
        )}
        {accounts.length > 0 ? (
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Send from</span>
            <select
              className="saas-input mt-1"
              value={smtpAccountId}
              onChange={(e) => setSmtpAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.fromEmail}
                  {a.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            Add an SMTP mailbox in Settings → Email automation first.
          </p>
        )}
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea
            className="min-h-[120px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <Button
          onClick={send}
          disabled={busy || !accounts.length || !subject.trim() || !body.trim()}
          loading={busy}
        >
          Send email
        </Button>

        {emails.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[12px] font-semibold text-ink">Conversation</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {emails.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl bg-[#faf8fc] px-3 py-2 text-[12px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-ink">
                      {m.direction === "inbound" ? "Received" : "Sent"} · {m.status}
                    </span>
                    <span className="text-[10px] text-ink-faint">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 font-medium text-ink-muted">{m.subject}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-ink-faint">
                    {m.body}
                  </p>
                  {m.error && (
                    <p className="mt-1 text-red-600">{m.error}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
