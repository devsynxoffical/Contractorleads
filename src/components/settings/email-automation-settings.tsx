"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SmtpForm = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
  hasPassword: boolean;
};

type SequenceForm = {
  name: string;
  enabled: boolean;
  day1Subject: string;
  day1Body: string;
  day2Subject: string;
  day2Body: string;
  day3Subject: string;
  day3Body: string;
};

export function EmailAutomationSettings() {
  const [smtp, setSmtp] = useState<SmtpForm>({
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    enabled: true,
    hasPassword: false,
  });
  const [sequence, setSequence] = useState<SequenceForm | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/smtp").then((r) => r.json()),
      fetch("/api/settings/email-sequence").then((r) => r.json()),
    ]).then(([smtpData, seqData]) => {
      if (smtpData.settings) {
        setSmtp((s) => ({
          ...s,
          ...smtpData.settings,
          password: "",
        }));
      }
      if (seqData.sequence) setSequence(seqData.sequence);
    });
  }, []);

  async function saveSmtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/smtp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smtp),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to save SMTP");
      return;
    }
    setSmtp((s) => ({ ...s, password: "", hasPassword: true }));
    setMsg("SMTP settings saved");
  }

  async function testSmtp() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test" }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? data.message : data.error || "Test failed");
  }

  async function saveSequence(e: React.FormEvent) {
    e.preventDefault();
    if (!sequence) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/email-sequence", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sequence),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to save sequence");
      return;
    }
    setSequence(data.sequence);
    setMsg("Day 1 / 2 / 3 sequence saved");
  }

  async function processDue() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/email/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Process failed");
      return;
    }
    const sent = (data.results || []).filter((r: { sent?: number }) => r.sent).length;
    setMsg(`Processed queue — ${sent} email(s) sent`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {msg ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-[13px] text-brand-800">
          {msg}
        </p>
      ) : null}

      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Your SMTP (send as you)</CardTitle>
          <p className="text-[13px] text-ink-muted">
            Connect Gmail, Outlook, or any SMTP provider. Outreach Day 1–3 emails
            send from your mailbox to scraped lead emails.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSmtp} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>SMTP host</Label>
                <Input
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Port</Label>
                <Input
                  type="number"
                  value={smtp.port}
                  onChange={(e) =>
                    setSmtp({ ...smtp, port: Number(e.target.value) || 587 })
                  }
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={smtp.secure}
                  onChange={(e) =>
                    setSmtp({ ...smtp, secure: e.target.checked })
                  }
                />
                TLS / secure (465)
              </label>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input
                  value={smtp.username}
                  onChange={(e) =>
                    setSmtp({ ...smtp, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Password{" "}
                  {smtp.hasPassword ? (
                    <span className="font-normal text-ink-faint">(saved)</span>
                  ) : null}
                </Label>
                <Input
                  type="password"
                  value={smtp.password}
                  onChange={(e) =>
                    setSmtp({ ...smtp, password: e.target.value })
                  }
                  placeholder={smtp.hasPassword ? "Leave blank to keep" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label>From email</Label>
                <Input
                  type="email"
                  value={smtp.fromEmail}
                  onChange={(e) =>
                    setSmtp({ ...smtp, fromEmail: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>From name</Label>
                <Input
                  value={smtp.fromName}
                  onChange={(e) =>
                    setSmtp({ ...smtp, fromName: e.target.value })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink-muted">
              <input
                type="checkbox"
                checked={smtp.enabled}
                onChange={(e) =>
                  setSmtp({ ...smtp, enabled: e.target.checked })
                }
              />
              Enable SMTP sending
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                Save SMTP
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={testSmtp}
              >
                Test connection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {sequence ? (
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Day 1 · 2 · 3 email automation</CardTitle>
            <p className="text-[13px] text-ink-muted">
              Templates for nurture. Use {"{{ownerName}}"}, {"{{businessName}}"},{" "}
              {"{{fromName}}"}. Enroll leads from Saved Leads, then run due sends.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSequence} className="space-y-4">
              <label className="flex items-center gap-2 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={sequence.enabled}
                  onChange={(e) =>
                    setSequence({ ...sequence, enabled: e.target.checked })
                  }
                />
                Sequence enabled
              </label>
              {([1, 2, 3] as const).map((day) => {
                const subKey = `day${day}Subject` as keyof SequenceForm;
                const bodyKey = `day${day}Body` as keyof SequenceForm;
                return (
                  <div
                    key={day}
                    className="space-y-2 rounded-xl border border-border/80 p-3"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
                      Day {day}
                    </p>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input
                        value={String(sequence[subKey])}
                        onChange={(e) =>
                          setSequence({ ...sequence, [subKey]: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Body</Label>
                      <Textarea
                        className="min-h-[100px]"
                        value={String(sequence[bodyKey])}
                        onChange={(e) =>
                          setSequence({
                            ...sequence,
                            [bodyKey]: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  Save sequence
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={processDue}
                >
                  Send due Day 2 / 3 emails
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
