"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SmtpAccount = {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  isDefault: boolean;
  hasPassword: boolean;
  lastTestedAt: string | null;
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

const emptyAccount = (): Omit<SmtpAccount, "id" | "hasPassword" | "lastTestedAt" | "isDefault"> & {
  id?: string;
  password: string;
  isDefault: boolean;
  hasPassword: boolean;
} => ({
  label: "Mailbox",
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  fromEmail: "",
  fromName: null,
  enabled: true,
  isDefault: false,
  hasPassword: false,
});

export function EmailAutomationSettings() {
  const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
  const [editing, setEditing] = useState<ReturnType<typeof emptyAccount> | null>(
    null,
  );
  const [sequence, setSequence] = useState<SequenceForm | null>(null);
  const [enrollments, setEnrollments] = useState<
    Array<{
      id: string;
      status: string;
      day1SentAt: string | null;
      day2SentAt: string | null;
      day3SentAt: string | null;
      lastError: string | null;
      savedLead?: { lead?: { businessName?: string } };
    }>
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [smtpData, seqData] = await Promise.all([
      fetch("/api/settings/smtp-accounts").then((r) => r.json()),
      fetch("/api/settings/email-sequence").then((r) => r.json()),
    ]);
    setAccounts(smtpData.accounts ?? []);
    if (seqData.sequence) setSequence(seqData.sequence);
    setEnrollments(seqData.enrollments ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMsg(null);
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/settings/smtp-accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to save mailbox");
      return;
    }
    setEditing(null);
    setMsg("Mailbox saved");
    await load();
  }

  async function testAccount(id?: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/smtp-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", id }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? data.message : data.error || "Test failed");
    if (res.ok) await load();
  }

  async function setDefault(id: string) {
    setBusy(true);
    const res = await fetch("/api/settings/smtp-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default", id }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts ?? []);
      setMsg("Default mailbox updated");
    }
  }

  async function removeAccount(id: string) {
    if (!confirm("Delete this SMTP mailbox?")) return;
    setBusy(true);
    const res = await fetch(`/api/settings/smtp-accounts?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Delete failed");
      return;
    }
    setAccounts(data.accounts ?? []);
    setMsg("Mailbox removed");
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
    const sent = (data.results || []).filter((r: { sent?: number }) => r.sent)
      .length;
    setMsg(`Processed queue — ${sent} email(s) sent`);
    await load();
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
          <CardTitle>SMTP mailboxes</CardTitle>
          <p className="text-[13px] text-ink-muted">
            Add multiple Gmail, Outlook, or custom SMTP accounts. Pick which
            mailbox to send from when emailing a lead.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[13px]"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {a.label}
                    {a.isDefault ? (
                      <span className="ml-2 text-[11px] font-medium text-brand-600">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {a.fromEmail} · {a.host}:{a.port}
                    {!a.enabled ? " · disabled" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!a.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setDefault(a.id)}
                    >
                      Make default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => testAccount(a.id)}
                  >
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      setEditing({
                        id: a.id,
                        label: a.label,
                        host: a.host,
                        port: a.port,
                        secure: a.secure,
                        username: a.username,
                        password: "",
                        fromEmail: a.fromEmail,
                        fromName: a.fromName,
                        enabled: a.enabled,
                        isDefault: a.isDefault,
                        hasPassword: a.hasPassword,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy}
                    onClick={() => removeAccount(a.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {!accounts.length && (
              <li className="text-[13px] text-ink-muted">
                No mailboxes yet. Add your first SMTP account below.
              </li>
            )}
          </ul>

          {!editing ? (
            <Button
              variant="secondary"
              onClick={() =>
                setEditing({
                  ...emptyAccount(),
                  isDefault: accounts.length === 0,
                })
              }
            >
              Add SMTP mailbox
            </Button>
          ) : (
            <form
              onSubmit={saveAccount}
              className="space-y-3 rounded-xl border border-border p-3"
            >
              <p className="text-[13px] font-semibold text-ink">
                {editing.id ? "Edit mailbox" : "New mailbox"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Label</Label>
                  <Input
                    value={editing.label}
                    onChange={(e) =>
                      setEditing({ ...editing, label: e.target.value })
                    }
                    placeholder="Sales Gmail"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>SMTP host</Label>
                  <Input
                    value={editing.host}
                    onChange={(e) =>
                      setEditing({ ...editing, host: e.target.value })
                    }
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={editing.port}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        port: Number(e.target.value) || 587,
                      })
                    }
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-[13px] text-ink-muted">
                  <input
                    type="checkbox"
                    checked={editing.secure}
                    onChange={(e) =>
                      setEditing({ ...editing, secure: e.target.checked })
                    }
                  />
                  TLS / secure (465)
                </label>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input
                    value={editing.username}
                    onChange={(e) =>
                      setEditing({ ...editing, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Password{" "}
                    {editing.hasPassword ? (
                      <span className="font-normal text-ink-faint">(saved)</span>
                    ) : null}
                  </Label>
                  <Input
                    type="password"
                    value={editing.password}
                    onChange={(e) =>
                      setEditing({ ...editing, password: e.target.value })
                    }
                    placeholder={
                      editing.hasPassword ? "Leave blank to keep" : ""
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>From email</Label>
                  <Input
                    type="email"
                    value={editing.fromEmail}
                    onChange={(e) =>
                      setEditing({ ...editing, fromEmail: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>From name</Label>
                  <Input
                    value={editing.fromName ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, fromName: e.target.value })
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) =>
                    setEditing({ ...editing, enabled: e.target.checked })
                  }
                />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={editing.isDefault}
                  onChange={(e) =>
                    setEditing({ ...editing, isDefault: e.target.checked })
                  }
                />
                Set as default mailbox
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  Save mailbox
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {sequence ? (
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Day 1 · 2 · 3 email automation</CardTitle>
            <p className="text-[13px] text-ink-muted">
              Templates for nurture. Use {"{{ownerName}}"}, {"{{businessName}}"},{" "}
              {"{{fromName}}"}. Day 1 sends on enroll; Days 2–3 send when you use
              the app (or via cron).
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

            {enrollments.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-[12px] font-semibold text-ink">
                  Recent enrollments
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-[12px] text-ink-muted">
                  {enrollments.map((en) => (
                    <li key={en.id}>
                      {en.savedLead?.lead?.businessName || "Lead"} · {en.status}
                      {en.lastError ? ` · ${en.lastError}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
