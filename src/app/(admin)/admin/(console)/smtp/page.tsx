"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/components/dashboard/hud-panel";
import {
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineServerStack,
  HiOutlinePaperAirplane,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

type SystemMailbox = {
  id: string;
  label: string;
  domain: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  isDefault: boolean;
  sendWeight: number;
  lastTestedAt: string | null;
  createdAt: string;
  emailsSent: number;
  isSystem: boolean;
};

export default function AdminSmtpPage() {
  const [accounts, setAccounts] = useState<SystemMailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SystemMailbox | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formHost, setFormHost] = useState("smtp.hostinger.com");
  const [formPort, setFormPort] = useState(465);
  const [formSecure, setFormSecure] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/smtp");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const domains = useMemo(() => {
    const list = Array.from(new Set(accounts.map((a) => a.domain).filter(Boolean)));
    return ["all", ...list];
  }, [accounts]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchDomain = selectedDomain === "all" || a.domain === selectedDomain;
      const matchSearch =
        !search ||
        a.fromEmail.toLowerCase().includes(search.toLowerCase()) ||
        (a.fromName && a.fromName.toLowerCase().includes(search.toLowerCase())) ||
        a.domain.toLowerCase().includes(search.toLowerCase());
      return matchDomain && matchSearch;
    });
  }, [accounts, selectedDomain, search]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.enabled).length;
    const totalSent = accounts.reduce((acc, curr) => acc + (curr.emailsSent || 0), 0);
    const domainCount = new Set(accounts.map((a) => a.domain)).size;
    return { total, active, totalSent, domainCount };
  }, [accounts]);

  async function handleTest(id: string) {
    setTestingId(id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", id }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatusMsg({ type: "success", text: json.message || "Connection verified!" });
        await loadData();
      } else {
        setStatusMsg({ type: "error", text: json.error || json.message || "Connection failed" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setTestingId(null);
    }
  }

  async function handleTestAll() {
    setTestingAll(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", testAll: true }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatusMsg({ type: "success", text: json.message || "All mailboxes tested." });
        await loadData();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Batch testing failed" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setTestingAll(false);
    }
  }

  async function handleToggle(id: string, currentEnabled: boolean) {
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, enabled: !currentEnabled }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled: !currentEnabled } : a)),
        );
      }
    } catch {
      // ignore
    }
  }

  async function handleSyncDefault() {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatusMsg({ type: "success", text: json.message || "All 25 Hostinger mailboxes synced." });
        await loadData();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Sync failed" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Are you sure you want to delete mailbox ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/smtp?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setStatusMsg({ type: "success", text: `Mailbox ${email} deleted.` });
      }
    } catch {
      // ignore
    }
  }

  function openCreateModal() {
    setEditingAccount(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormDomain("roofingagency.us");
    setFormHost("smtp.hostinger.com");
    setFormPort(465);
    setFormSecure(true);
    setIsModalOpen(true);
  }

  function openEditModal(acc: SystemMailbox) {
    setEditingAccount(acc);
    setFormName(acc.fromName || "");
    setFormEmail(acc.fromEmail);
    setFormPassword("");
    setFormDomain(acc.domain);
    setFormHost(acc.host);
    setFormPort(acc.port);
    setFormSecure(acc.secure);
    setIsModalOpen(true);
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        id: editingAccount?.id,
        fromName: formName,
        fromEmail: formEmail,
        domain: formDomain || formEmail.split("@")[1] || "roofingagency.us",
        host: formHost,
        port: formPort,
        secure: formSecure,
      };
      if (formPassword) payload.password = formPassword;

      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: "success",
          text: editingAccount ? "Mailbox updated." : "Mailbox created successfully.",
        });
        setIsModalOpen(false);
        await loadData();
      } else {
        alert(json.error || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Super Admin Hostinger SMTP Pool"
        description="25 Hostinger mailboxes across 5 domains configured for system-wide cold outreach & lead sends."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSyncDefault}
              disabled={syncing}
              className="gap-1.5"
            >
              <HiOutlineArrowPath className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing 25 Mailboxes…" : "Re-sync 25 Default Mailboxes"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestAll}
              disabled={testingAll}
              className="gap-1.5"
            >
              <HiOutlineShieldCheck />
              {testingAll ? "Testing All…" : "Test All Connections"}
            </Button>
            <Button size="sm" onClick={openCreateModal} className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white">
              <HiOutlinePlus />
              Add Mailbox
            </Button>
          </div>
        }
      />

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
            statusMsg.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
          }`}
        >
          {statusMsg.type === "success" ? (
            <HiOutlineCheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <HiOutlineXCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Mailboxes</span>
            <HiOutlineEnvelope className="h-5 w-5 text-brand-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{stats.total}</p>
          <p className="mt-0.5 text-xs text-ink-muted">25 Hostinger seed inboxes</p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pool</span>
            <HiOutlineCheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.active}</p>
          <p className="mt-0.5 text-xs text-ink-muted">Ready for user sends</p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Domains</span>
            <HiOutlineServerStack className="h-5 w-5 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{stats.domainCount}</p>
          <p className="mt-0.5 text-xs text-ink-muted">5 inboxes per domain</p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Emails Sent</span>
            <HiOutlinePaperAirplane className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{stats.totalSent}</p>
          <p className="mt-0.5 text-xs text-ink-muted">Total platform outreach</p>
        </div>
      </div>

      {/* Domain Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedDomain === d
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-border bg-[var(--surface)] text-ink-muted hover:text-ink"
              }`}
            >
              {d === "all" ? "All Domains (25)" : d}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full text-xs"
          />
        </div>
      </div>

      {/* Main Mailbox List */}
      <HudPanel
        title="Hostinger SMTP Mailboxes"
        subtitle="Host: smtp.hostinger.com · Port 465 (SSL) · Automatic round-robin rotation for user outreach"
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted animate-pulse">
            Loading Hostinger mailboxes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-muted">
            No mailboxes match your search. Click &ldquo;Re-sync 25 Default Mailboxes&rdquo; to restore.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="pb-3 pl-2">Display Name & Email</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Host & Port</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Last Tested</th>
                  <th className="pb-3">Sent Count</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-2">
                      <p className="font-semibold text-ink text-[13px]">{acc.fromName || "Unnamed"}</p>
                      <p className="font-mono text-ink-muted text-[11px]">{acc.fromEmail}</p>
                    </td>
                    <td className="py-3">
                      <span className="rounded-md border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-400">
                        {acc.domain}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-ink-muted">
                      {acc.host}:{acc.port} {acc.secure ? "SSL" : "TLS"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleToggle(acc.id, acc.enabled)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                          acc.enabled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-ink-muted/10 text-ink-muted border border-border hover:bg-ink-muted/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            acc.enabled ? "bg-emerald-400" : "bg-ink-muted"
                          }`}
                        />
                        {acc.enabled ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-3 text-[11px] text-ink-muted">
                      {acc.lastTestedAt ? (
                        <span className="text-emerald-400">
                          {new Date(acc.lastTestedAt).toLocaleDateString()} {new Date(acc.lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-ink-faint">Untested</span>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-ink">
                      {acc.emailsSent || 0}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(acc.id)}
                          disabled={testingId === acc.id}
                          className="h-7 px-2 text-[11px]"
                          title="Test SMTP Connection"
                        >
                          <HiOutlineShieldCheck className={`h-3.5 w-3.5 ${testingId === acc.id ? "animate-spin text-brand-400" : ""}`} />
                          {testingId === acc.id ? "Testing…" : "Test"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(acc)}
                          className="h-7 px-2 text-[11px]"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(acc.id, acc.fromEmail)}
                          className="h-7 px-1.5 text-[11px] text-rose-400 hover:text-rose-300"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>

      {/* Modal for adding/editing mailbox */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[var(--surface-elevated,var(--surface))] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">
              {editingAccount ? "Edit Hostinger Mailbox" : "Add Hostinger Mailbox"}
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Configure SMTP credentials for sending cold outreach.
            </p>

            <form onSubmit={handleSaveAccount} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gaurav Kapoor"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="saas-input mt-1 w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Email Address (Username)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. gaurav@roofingagency.us"
                  value={formEmail}
                  onChange={(e) => {
                    setFormEmail(e.target.value);
                    if (e.target.value.includes("@")) {
                      setFormDomain(e.target.value.split("@")[1]);
                    }
                  }}
                  className="saas-input mt-1 w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  {editingAccount ? "Password (leave empty to keep current)" : "Mailbox Password"}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingAccount}
                    placeholder="Hostinger mailbox password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="saas-input w-full pr-8 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  >
                    {showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-ink">SMTP Host</label>
                  <input
                    type="text"
                    required
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    className="saas-input mt-1 w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink">Port</label>
                  <input
                    type="number"
                    required
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="saas-input mt-1 w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="secureCheck"
                  checked={formSecure}
                  onChange={(e) => setFormSecure(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="secureCheck" className="text-xs text-ink cursor-pointer">
                  Use SSL (Required for Port 465)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {saving ? "Saving…" : "Save Mailbox"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
