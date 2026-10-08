"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  hasResendKey?: boolean;
  lastTestedAt: string | null;
  deliveryMode: "platform" | "smtp";
  sendWeight?: number;
  isSystem?: boolean;
  provider?: string;
  domain?: string;
};

type AccountPerformance = {
  id: string;
  label: string;
  fromEmail: string;
  enabled: boolean;
  sendWeight: number;
  desiredShare: number;
  actualShare: number;
  sent: number;
  failed: number;
  delivered: number;
  replied: number;
  opened: number;
  openRate: number;
  bounceRate: number;
  replyRate: number;
  healthScore: number;
  suggestedWeight: number;
};

type EditingAccount = Omit<SmtpAccount, "id" | "hasPassword" | "hasResendKey" | "lastTestedAt" | "isDefault"> & {
  id?: string;
  password: string;
  resendApiKey: string;
  isDefault: boolean;
  hasPassword: boolean;
  hasResendKey: boolean;
  deliveryMode: "platform" | "smtp";
  sendWeight: number;
};

type SequenceStep = {
  day: number;
  subject: string;
  body: string;
};

type SequenceForm = {
  name: string;
  enabled: boolean;
};

const emptyAccount = (): EditingAccount => ({
  label: "Primary sender",
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  resendApiKey: "",
  fromEmail: "",
  fromName: null,
  enabled: true,
  isDefault: false,
  hasPassword: false,
  hasResendKey: false,
  deliveryMode: "platform",
  sendWeight: 1,
});

export function EmailAutomationSettings() {
  const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
  const [performance, setPerformance] = useState<AccountPerformance[]>([]);
  const [editing, setEditing] = useState<EditingAccount | null>(null);
  const [sequence, setSequence] = useState<SequenceForm | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [enrollments, setEnrollments] = useState<
    Array<{
      id: string;
      status: string;
      sentCount?: number;
      totalSteps?: number;
      lastError: string | null;
      savedLead?: { lead?: { businessName?: string } };
    }>
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Rotation & Throttling Settings
  const [rotationConfig, setRotationConfig] = useState({
    strategy: "even-distribution" as "even-distribution" | "round-robin" | "weighted",
    emailsPerDomain: 2,
    autoBalance: true,
    delaySeconds: 2,
    dailyLimitPerDomain: 50,
  });
  const [totalDomains, setTotalDomains] = useState(25);
  const [totalMailboxes, setTotalMailboxes] = useState(25);
  const [simLeads, setSimLeads] = useState(50);
  const [savingRotation, setSavingRotation] = useState(false);
  const [rotationSavedMsg, setRotationSavedMsg] = useState<string | null>(null);

  async function load() {
    const [smtpData, seqData, rotData] = await Promise.all([
      fetch("/api/settings/smtp-accounts").then((r) => r.json()).catch(() => ({})),
      fetch("/api/settings/email-sequence").then((r) => r.json()).catch(() => ({})),
      fetch("/api/settings/email-rotation").then((r) => r.json()).catch(() => ({})),
    ]);
    if (rotData?.config) setRotationConfig(rotData.config);
    if (rotData?.totalDomains) setTotalDomains(rotData.totalDomains);
    if (rotData?.totalMailboxes) setTotalMailboxes(rotData.totalMailboxes);
    setAccounts(
      (smtpData.accounts ?? []).map(
        (a: SmtpAccount & { deliveryMode?: string }) => ({
          ...a,
          deliveryMode:
            a.deliveryMode === "smtp" || a.deliveryMode === "platform"
              ? a.deliveryMode
              : a.host?.trim()
                ? "smtp"
                : "platform",
          sendWeight: Number(a.sendWeight) || 1,
        }),
      ),
    );
    setPerformance(smtpData.performance ?? []);
    if (seqData.sequence) {
      setSequence({
        name: seqData.sequence.name,
        enabled: seqData.sequence.enabled,
      });
    }
    setSteps(seqData.steps ?? []);
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
    setMsg("Sender saved");
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

  async function setWeight(id: string, sendWeight: number) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/smtp-accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_weight", id, sendWeight }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not update rotation share");
      return;
    }
    setAccounts(data.accounts ?? []);
    setPerformance(data.performance ?? []);
    setMsg("Rotation share updated — new sends will follow the new split.");
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
      body: JSON.stringify({ ...sequence, steps }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to save sequence");
      return;
    }
    setSequence({ name: data.sequence.name, enabled: data.sequence.enabled });
    setSteps(data.steps ?? steps);
    setMsg(`Nurture sequence saved — ${data.steps?.length ?? steps.length} step(s)`);
  }

  function updateStep(index: number, patch: Partial<SequenceStep>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function addStep() {
    setSteps((prev) => {
      if (prev.length >= 15) return prev;
      const lastDay = prev.length ? prev[prev.length - 1].day : 0;
      return [
        ...prev,
        {
          day: Math.min(120, lastDay + 2),
          subject: "",
          body: "",
        },
      ];
    });
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
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

  async function saveRotationSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingRotation(true);
    setRotationSavedMsg(null);
    try {
      const res = await fetch("/api/settings/email-rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rotationConfig),
      });
      if (res.ok) {
        setRotationSavedMsg("Domain & Mailbox rotation settings saved successfully!");
        setTimeout(() => setRotationSavedMsg(null), 3500);
      }
    } finally {
      setSavingRotation(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {msg ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-[13px] text-brand-800">
          {msg}
        </p>
      ) : null}

      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Email senders &amp; Mailboxes</CardTitle>
            <p className="text-[13px] text-ink-muted">
              Connect GoDaddy, Hostinger, or Custom SMTP mailboxes. All outbound outreach auto-rotates across your enabled mailboxes, and all incoming replies are automatically fetched.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  const res = await fetch("/api/emails/inbox/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fetchAll: true, limit: 100 }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setMsg(
                      `✅ Synced ${data.totalSynced ?? 0} email(s) across ${data.mailboxesCount ?? accounts.length} mailbox(es). All old and new messages are in your inbox.`,
                    );
                  } else {
                    setMsg(data.error || "Sync failed");
                  }
                } catch {
                  setMsg("Sync failed. Check connection.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              🔄 Fetch / Sync Inboxes
            </Button>
            {!editing && (
              <Button
                size="sm"
                onClick={() =>
                  setEditing({
                    ...emptyAccount(),
                    deliveryMode: "smtp",
                    host: "smtpout.secureserver.net",
                    port: 465,
                    secure: true,
                    isDefault: accounts.length === 0,
                  })
                }
              >
                + Add Mailbox
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {accounts.map((a) => {
              const isGoDaddy = a.provider === "godaddy" || a.host?.includes("secureserver");
              const isHostinger = a.provider === "hostinger" || a.host?.includes("hostinger");

              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#faf8fc] px-3.5 py-2.5 text-[13px] border border-border/70"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{a.label}</p>
                      {a.isSystem && (
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          {isGoDaddy ? "GoDaddy System" : isHostinger ? "Hostinger System" : "System Mailbox"}
                        </span>
                      )}
                      {!a.isSystem && a.deliveryMode === "smtp" && (
                        <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                          {isGoDaddy ? "GoDaddy Custom" : isHostinger ? "Hostinger Custom" : "Custom SMTP"}
                        </span>
                      )}
                      {a.deliveryMode === "platform" && (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          Resend API
                        </span>
                      )}
                      {a.isDefault ? (
                        <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {a.fromEmail}
                      {a.deliveryMode === "platform"
                        ? " · Resend API"
                        : ` · SMTP ${a.host}:${a.port}`}
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
                    {!a.isSystem && (
                      <>
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
                              resendApiKey: "",
                              fromEmail: a.fromEmail,
                              fromName: a.fromName,
                              enabled: a.enabled,
                              isDefault: a.isDefault,
                              hasPassword: a.hasPassword,
                              hasResendKey: Boolean(a.hasResendKey),
                              deliveryMode: a.deliveryMode,
                              sendWeight: Number(a.sendWeight) || 1,
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
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {!accounts.length && (
              <li className="text-[13px] text-ink-muted">
                No mailboxes connected yet. Click &quot;Add Mailbox&quot; above to connect your email.
              </li>
            )}
          </ul>

          {editing && (
            <form
              onSubmit={saveAccount}
              className="space-y-3.5 rounded-xl border border-border bg-[var(--surface)] p-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-[14px] font-bold text-ink">
                  {editing.id ? "Edit Mailbox" : "Add New Mailbox"}
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="text-xs text-ink-muted hover:text-ink font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* Provider Presets */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Quick Provider Preset
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {[
                    { id: "godaddy", label: "GoDaddy", host: "smtpout.secureserver.net", port: 465, secure: true, mode: "smtp" as const },
                    { id: "hostinger", label: "Hostinger", host: "smtp.hostinger.com", port: 465, secure: true, mode: "smtp" as const },
                    { id: "gmail", label: "Gmail", host: "smtp.gmail.com", port: 465, secure: true, mode: "smtp" as const },
                    { id: "outlook", label: "Outlook / 365", host: "smtp.office365.com", port: 587, secure: false, mode: "smtp" as const },
                    { id: "resend", label: "Resend API", host: "", port: 587, secure: false, mode: "platform" as const },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          deliveryMode: p.mode,
                          host: p.host,
                          port: p.port,
                          secure: p.secure,
                        })
                      }
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-center text-xs font-semibold transition",
                        editing.host === p.host && editing.deliveryMode === p.mode
                          ? "border-brand-600 bg-brand-50 text-brand-700 shadow-xs"
                          : "border-border text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Mailbox Label</Label>
                  <Input
                    value={editing.label}
                    onChange={(e) =>
                      setEditing({ ...editing, label: e.target.value })
                    }
                    placeholder="e.g. Sales Outreach - GoDaddy"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>From Email *</Label>
                  <Input
                    type="email"
                    value={editing.fromEmail}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        fromEmail: e.target.value,
                        username: editing.username || e.target.value,
                      })
                    }
                    placeholder="sales@yourdomain.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sender Display Name</Label>
                  <Input
                    value={editing.fromName ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, fromName: e.target.value })
                    }
                    placeholder="Frank Miller"
                  />
                </div>
              </div>

              {editing.deliveryMode === "platform" ? (
                <div className="space-y-1.5">
                  <Label>
                    Resend API key{" "}
                    {editing.hasResendKey ? (
                      <span className="font-normal text-ink-faint">(saved)</span>
                    ) : null}
                  </Label>
                  <Input
                    type="password"
                    value={editing.resendApiKey}
                    onChange={(e) =>
                      setEditing({ ...editing, resendApiKey: e.target.value })
                    }
                    placeholder={editing.hasResendKey ? "Leave blank to keep" : "re_…"}
                    autoComplete="off"
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>SMTP Host *</Label>
                    <Input
                      value={editing.host}
                      onChange={(e) =>
                        setEditing({ ...editing, host: e.target.value })
                      }
                      placeholder="smtpout.secureserver.net"
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
                          port: Number(e.target.value) || 465,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Security</Label>
                    <select
                      value={editing.secure ? "ssl" : "starttls"}
                      onChange={(e) =>
                        setEditing({ ...editing, secure: e.target.value === "ssl" })
                      }
                      className="saas-input w-full text-xs"
                    >
                      <option value="ssl">SSL (Port 465)</option>
                      <option value="starttls">STARTTLS (Port 587)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Username / Login *</Label>
                    <Input
                      value={editing.username}
                      onChange={(e) =>
                        setEditing({ ...editing, username: e.target.value })
                      }
                      placeholder="sales@yourdomain.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Password *{" "}
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
                        editing.hasPassword ? "Leave blank to keep" : "Password"
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-1">
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
                  Set as default
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={busy} disabled={busy}>
                  Save Mailbox
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {performance.length > 0 && (
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Rotation performance</CardTitle>
            <p className="text-[13px] text-ink-muted">
              How much cold-outreach volume each mailbox has handled versus your
              target split. Actual share follows the rotation weights you set.
              Click a share to fine-tune that mailbox.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.map((p) => {
              const share = Math.min(100, Math.max(0, p.actualShare));
              const desired = Math.min(100, Math.max(0, p.desiredShare));
              const weightUp =
                p.suggestedWeight > p.sendWeight && p.actualShare < p.desiredShare - 2;
              const weightDown =
                p.suggestedWeight < p.sendWeight && p.actualShare > p.desiredShare + 2;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-medium">
                        {p.label}
                        {!p.enabled && (
                          <span className="ml-2 text-[12px] font-normal text-ink-faint">
                            disabled
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-ink-muted">
                        {p.fromEmail}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-medium tabular-nums">
                        {Math.round(share)}% actual · {Math.round(desired)}%
                        desired
                      </div>
                      <div className="text-[12px] text-ink-muted tabular-nums">
                        {p.sent} sent · {p.delivered} delivered · {p.opened}{" "}
                        opened · {p.failed} failed · {p.replied} replied
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <button
                      className="text-[12px] text-brand underline-offset-2 hover:underline"
                      onClick={() =>
                        weightUp
                          ? setWeight(p.id, p.suggestedWeight)
                          : weightDown
                            ? setWeight(p.id, p.suggestedWeight)
                            : setWeight(p.id, p.sendWeight)
                      }
                      title={
                        p.healthScore >= 80
                          ? "Healthy mailbox — keep this share"
                          : "Raise/lower share via the mailbox editor"
                      }
                    >
                      {weightUp
                        ? `Boost share (suggest ${p.suggestedWeight})`
                        : weightDown
                          ? `Cut share (suggest ${p.suggestedWeight})`
                          : `Weight ${p.sendWeight} · health ${Math.round(p.healthScore)}%`}
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted tabular-nums">
                    <span>Open {Math.round(p.openRate)}%</span>
                    <span>Bounce {Math.round(p.bounceRate)}%</span>
                    <span>Reply {Math.round(p.replyRate)}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Domain & Mailbox Rotation Engine */}
      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>⚡</span> Domain &amp; Mailbox Rotation Engine
              </CardTitle>
              <p className="mt-1 text-[13px] text-ink-muted">
                Configure how bulk outreach blasts are distributed across your {totalMailboxes} active mailboxes and {totalDomains} domains to guarantee high inbox deliverability.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700">
              {totalMailboxes} Mailboxes across {totalDomains} Domains Active
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveRotationSettings} className="space-y-4">
            {rotationSavedMsg && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700">
                🎉 {rotationSavedMsg}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Rotation Strategy</Label>
                <select
                  className="saas-input w-full text-xs font-medium"
                  value={rotationConfig.strategy}
                  onChange={(e) =>
                    setRotationConfig({
                      ...rotationConfig,
                      strategy: e.target.value as "even-distribution" | "round-robin" | "weighted",
                    })
                  }
                >
                  <option value="even-distribution">
                    ⚡ Even Batch Distribution (e.g. 50 leads across 25 domains = 2 emails per domain) — Recommended
                  </option>
                  <option value="round-robin">
                    🔄 Round-Robin (Cycles 1-by-1 through each mailbox sequentially)
                  </option>
                  <option value="weighted">
                    📊 Health &amp; Deliverability Weighted (Allocates proportional to mailbox score)
                  </option>
                </select>
                <p className="text-[11px] text-ink-muted">
                  Even distribution splits your recipient list equally across all active domains so no single domain is overused.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Emails Per Domain / Mailbox (Batch Cap)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={rotationConfig.emailsPerDomain}
                  onChange={(e) =>
                    setRotationConfig({
                      ...rotationConfig,
                      emailsPerDomain: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
                <label className="flex items-center gap-1.5 text-[11px] text-ink-muted pt-1">
                  <input
                    type="checkbox"
                    checked={rotationConfig.autoBalance}
                    onChange={(e) =>
                      setRotationConfig({
                        ...rotationConfig,
                        autoBalance: e.target.checked,
                      })
                    }
                  />
                  Auto-balance across total active domains (e.g. Total Leads ÷ {totalDomains} Domains)
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>Throttle Interval (Delay Between Sends)</Label>
                <select
                  className="saas-input w-full text-xs"
                  value={rotationConfig.delaySeconds}
                  onChange={(e) =>
                    setRotationConfig({
                      ...rotationConfig,
                      delaySeconds: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>⚡ 0s (Instant parallel batch)</option>
                  <option value={1}>⏱️ 1 second delay between sends</option>
                  <option value={2}>⏱️ 2 seconds delay (Recommended for cold outreach)</option>
                  <option value={3}>⏱️ 3 seconds delay</option>
                  <option value={5}>⏱️ 5 seconds delay (Strict warm-up)</option>
                  <option value={10}>⏱️ 10 seconds delay</option>
                  <option value={30}>⏱️ 30 seconds delay (High deliverability)</option>
                </select>
                <p className="text-[11px] text-ink-muted">
                  Paces outbound traffic so mailbox providers don&apos;t trigger velocity spam alerts.
                </p>
              </div>
            </div>

            {/* Interactive Live Rotation Preview Calculator */}
            <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <span>🧮</span> Live Rotation Simulator
                </span>
                <div className="flex items-center gap-1.5 text-xs text-brand-800 font-medium">
                  <span>Simulate send for</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={simLeads}
                    onChange={(e) => setSimLeads(Math.max(1, Number(e.target.value) || 1))}
                    className="h-7 w-16 rounded-md border border-brand-300 bg-white px-2 font-mono text-xs font-bold text-ink"
                  />
                  <span>leads:</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                <div className="rounded-lg bg-white p-2.5 border border-brand-200/60 shadow-xs">
                  <p className="text-[10px] font-semibold uppercase text-ink-muted">Total Leads</p>
                  <p className="text-sm font-bold text-ink">{simLeads}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-brand-200/60 shadow-xs">
                  <p className="text-[10px] font-semibold uppercase text-ink-muted">Active Domains</p>
                  <p className="text-sm font-bold text-brand-700">{totalDomains}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-brand-200/60 shadow-xs">
                  <p className="text-[10px] font-semibold uppercase text-ink-muted">Sends per Domain</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {rotationConfig.strategy === "even-distribution"
                      ? `${Math.ceil(simLeads / (totalDomains || 1))} emails / domain`
                      : `~${(simLeads / (totalDomains || 1)).toFixed(1)} emails`}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-brand-200/60 shadow-xs">
                  <p className="text-[10px] font-semibold uppercase text-ink-muted">Est. Campaign Time</p>
                  <p className="text-sm font-bold text-indigo-700">
                    {rotationConfig.delaySeconds === 0
                      ? "Instant (~2s)"
                      : `${Math.round((simLeads * rotationConfig.delaySeconds) / 60)} min (${simLeads * rotationConfig.delaySeconds}s)`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button type="submit" disabled={savingRotation} className="bg-brand-600 hover:bg-brand-700 text-white">
                {savingRotation ? "Saving Rotation Settings…" : "Save Rotation Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {sequence ? (
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Nurture sequence</CardTitle>
            <p className="text-[13px] text-ink-muted">
              A multi-day follow-up flow for enrolled leads. The Day 1 email
              sends the moment you enroll a lead; every later step sends
              automatically once its day arrives. Add as many days as you need
              (up to 15 steps). Use {"{{ownerName}}"}, {"{{businessName}}"},
              and {"{{fromName}}"} in any subject or body.
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

              {steps.map((step, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-xl border border-border/80 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                        {index + 1}
                      </span>
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
                        Step {index + 1} · sends on day
                      </p>
                      <Input
                        type="number"
                        min={index === 0 ? 1 : steps[index - 1].day + 1}
                        max={120}
                        className="h-8 w-20"
                        value={step.day}
                        onChange={(e) =>
                          updateStep(index, {
                            day: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-[12px] font-semibold text-red-600 hover:underline"
                      >
                        Remove step
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-muted">
                    {index === 0
                      ? "Sends immediately when a lead is enrolled."
                      : `Sends ${step.day - steps[index - 1].day <= 1 ? "1 day" : `${step.day - steps[index - 1].day} days`} after step ${index}.`}
                  </p>
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={step.subject}
                      onChange={(e) =>
                        updateStep(index, { subject: e.target.value })
                      }
                      placeholder="e.g. Quick intro"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Body</Label>
                    <Textarea
                      className="min-h-[100px]"
                      value={step.body}
                      onChange={(e) =>
                        updateStep(index, { body: e.target.value })
                      }
                      placeholder={"Hi {{ownerName}}, …"}
                    />
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || steps.length >= 15}
                  onClick={addStep}
                >
                  + Add another day
                </Button>
                <Button type="submit" disabled={busy}>
                  Save sequence
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={processDue}
                >
                  Send due follow-ups now
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
                      {typeof en.sentCount === "number" &&
                      typeof en.totalSteps === "number"
                        ? ` · ${en.sentCount}/${en.totalSteps} emails sent`
                        : ""}
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
