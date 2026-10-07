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
  HiOutlineUser,
  HiOutlineUserPlus,
  HiOutlineUserMinus,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";

type SystemMailbox = {
  id: string;
  label: string;
  provider: "hostinger" | "godaddy" | string;
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
  assignedUserId: string | null;
  assignedUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  lastTestedAt: string | null;
  createdAt: string;
  emailsSent: number;
  isSystem: boolean;
};

type AppUser = {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  role: string;
};

export default function AdminSmtpPage() {
  const [accounts, setAccounts] = useState<SystemMailbox[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Assign user modal state
  const [assigningMailbox, setAssigningMailbox] = useState<SystemMailbox | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Edit / Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SystemMailbox | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formProvider, setFormProvider] = useState<"hostinger" | "godaddy">("godaddy");
  const [formHost, setFormHost] = useState("smtpout.secureserver.net");
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
        if (data.users) setUsers(data.users);
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
    const providerFiltered = selectedProvider === "all"
      ? accounts
      : accounts.filter((a) => a.provider === selectedProvider);
    const list = Array.from(new Set(providerFiltered.map((a) => a.domain).filter(Boolean)));
    return ["all", ...list];
  }, [accounts, selectedProvider]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchProvider = selectedProvider === "all" || a.provider === selectedProvider;
      const matchDomain = selectedDomain === "all" || a.domain === selectedDomain;
      const matchSearch =
        !search ||
        a.fromEmail.toLowerCase().includes(search.toLowerCase()) ||
        (a.fromName && a.fromName.toLowerCase().includes(search.toLowerCase())) ||
        a.domain.toLowerCase().includes(search.toLowerCase()) ||
        (a.assignedUser?.name && a.assignedUser.name.toLowerCase().includes(search.toLowerCase())) ||
        (a.assignedUser?.email && a.assignedUser.email.toLowerCase().includes(search.toLowerCase()));
      return matchProvider && matchDomain && matchSearch;
    });
  }, [accounts, selectedProvider, selectedDomain, search]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.enabled).length;
    const hostinger = accounts.filter((a) => a.provider === "hostinger").length;
    const godaddy = accounts.filter((a) => a.provider === "godaddy").length;
    const assigned = accounts.filter((a) => Boolean(a.assignedUserId)).length;
    const totalSent = accounts.reduce((acc, curr) => acc + (curr.emailsSent || 0), 0);
    const domainCount = new Set(accounts.map((a) => a.domain)).size;
    return { total, active, hostinger, godaddy, assigned, totalSent, domainCount };
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

  async function handleSyncAll() {
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
        setStatusMsg({ type: "success", text: json.message || "All 65 mailboxes synced." });
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

  async function handleAssignUserSubmit() {
    if (!assigningMailbox) return;
    setAssigningLoading(true);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          id: assigningMailbox.id,
          assignedUserId: selectedUserId || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: "success",
          text: selectedUserId
            ? `Assigned ${assigningMailbox.fromEmail} to user.`
            : `Unassigned ${assigningMailbox.fromEmail} (returned to shared pool).`,
        });
        setAssigningMailbox(null);
        await loadData();
      } else {
        alert(json.error || "Assignment failed");
      }
    } finally {
      setAssigningLoading(false);
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
    setFormProvider("godaddy");
    setFormDomain("frankmillerconnect.com");
    setFormHost("smtpout.secureserver.net");
    setFormPort(465);
    setFormSecure(true);
    setIsModalOpen(true);
  }

  function openEditModal(acc: SystemMailbox) {
    setEditingAccount(acc);
    setFormName(acc.fromName || "");
    setFormEmail(acc.fromEmail);
    setFormPassword("");
    setFormProvider((acc.provider as "hostinger" | "godaddy") || "godaddy");
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
        domain: formDomain || formEmail.split("@")[1] || "frankmillerconnect.com",
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
        title="Super Admin SMTP Mailbox Pool"
        description="Manage and assign 65 outreach mailboxes across 15 domains (25 Hostinger + 40 GoDaddy)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSyncAll}
              disabled={syncing}
              className="gap-1.5"
            >
              <HiOutlineArrowPath className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing 65 Mailboxes…" : "Re-sync All 65 Mailboxes"}
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inboxes</span>
            <HiOutlineEnvelope className="h-5 w-5 text-brand-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{stats.total}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{stats.domainCount} active domains</p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">GoDaddy Pool</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">GoDaddy</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.godaddy}</p>
          <p className="mt-0.5 text-xs text-ink-muted">10 domains (4 per domain)</p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Hostinger Pool</span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">Hostinger</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-400">{stats.hostinger}</p>
          <p className="mt-0.5 text-xs text-ink-muted">5 domains (5 per domain)</p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned to Users</span>
            <HiOutlineUser className="h-5 w-5 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-400">{stats.assigned}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{stats.total - stats.assigned} in shared pool</p>
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

      {/* Provider Selector Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setSelectedProvider("all");
            setSelectedDomain("all");
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            selectedProvider === "all"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          All Mailboxes ({stats.total})
        </button>
        <button
          onClick={() => {
            setSelectedProvider("godaddy");
            setSelectedDomain("all");
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            selectedProvider === "godaddy"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          GoDaddy Mailboxes ({stats.godaddy})
        </button>
        <button
          onClick={() => {
            setSelectedProvider("hostinger");
            setSelectedDomain("all");
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            selectedProvider === "hostinger"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Hostinger Mailboxes ({stats.hostinger})
        </button>
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
              {d === "all" ? "All Domains" : d}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, email, domain, or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full text-xs"
          />
        </div>
      </div>

      {/* Main Mailbox List */}
      <HudPanel
        title={
          selectedProvider === "godaddy"
            ? "GoDaddy SMTP Mailbox Pool (smtpout.secureserver.net:465 SSL)"
            : selectedProvider === "hostinger"
            ? "Hostinger SMTP Mailbox Pool (smtp.hostinger.com:465 SSL)"
            : "Multi-Provider System SMTP Mailboxes (65 Inboxes)"
        }
        subtitle="Shared cold outreach & lead sends with individual customer assignment options."
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted animate-pulse">
            Loading mailboxes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-muted">
            No mailboxes match your search. Click &ldquo;Re-sync All 65 Mailboxes&rdquo; to restore.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="pb-3 pl-2">Display Name & Email</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Assigned User</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Last Tested</th>
                  <th className="pb-3">Sent Count</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((acc) => {
                  const isGoDaddy = acc.provider === "godaddy" || (!acc.domain.includes("roofing") && acc.domain.includes("frankmiller"));
                  return (
                    <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pl-2">
                        <p className="font-semibold text-ink text-[13px]">{acc.fromName || "Frank Miller"}</p>
                        <p className="font-mono text-ink-muted text-[11px]">{acc.fromEmail}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isGoDaddy
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                          }`}
                        >
                          {isGoDaddy ? "GoDaddy" : "Hostinger"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="rounded-md border border-border bg-[var(--surface-elevated,var(--surface))] px-2 py-0.5 text-[11px] font-medium text-ink">
                          {acc.domain}
                        </span>
                      </td>
                      <td className="py-3">
                        {acc.assignedUser ? (
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                              {acc.assignedUser.name || acc.assignedUser.email}
                            </span>
                            <button
                              onClick={() => {
                                setAssigningMailbox(acc);
                                setSelectedUserId("");
                              }}
                              className="text-ink-muted hover:text-rose-400 transition-colors"
                              title="Reassign or Unassign"
                            >
                              <HiOutlineUserMinus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAssigningMailbox(acc);
                              setSelectedUserId("");
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand-400 transition-colors border border-dashed border-border rounded px-2 py-0.5"
                          >
                            <HiOutlineUserPlus className="h-3 w-3" />
                            Shared Pool
                          </button>
                        )}
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
                            onClick={() => {
                              setAssigningMailbox(acc);
                              setSelectedUserId(acc.assignedUserId || "");
                            }}
                            className="h-7 px-2 text-[11px] text-sky-400 hover:text-sky-300"
                            title="Assign to Customer"
                          >
                            <HiOutlineUser className="h-3.5 w-3.5" />
                            Assign
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(acc.id)}
                            disabled={testingId === acc.id}
                            className="h-7 px-2 text-[11px]"
                            title="Test Connection"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>

      {/* Modal for Assigning Mailbox to User */}
      {assigningMailbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[var(--surface-elevated,var(--surface))] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">Assign Mailbox to Customer</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Select a customer / user who will have access to send outreach from <span className="font-mono text-ink">{assigningMailbox.fromEmail}</span>.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Customer / User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="saas-input mt-1 w-full text-xs"
                >
                  <option value="">-- Shared Pool (Available to all users) --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || "Unnamed"} ({u.email}) {u.companyName ? `— ${u.companyName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-300">
                {selectedUserId ? (
                  <p>When assigned, this user will automatically see and use this mailbox in their campaign sequences and lead emails.</p>
                ) : (
                  <p>When in the shared pool, this mailbox rotates round-robin across platform-wide outreach.</p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAssigningMailbox(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={assigningLoading}
                  onClick={handleAssignUserSubmit}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {assigningLoading ? "Saving…" : "Save Assignment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding/editing mailbox */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[var(--surface-elevated,var(--surface))] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">
              {editingAccount ? "Edit Mailbox" : "Add SMTP Mailbox"}
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Configure SMTP credentials for GoDaddy or Hostinger mailboxes.
            </p>

            <form onSubmit={handleSaveAccount} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Provider</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormProvider("godaddy");
                      setFormHost("smtpout.secureserver.net");
                      setFormPort(465);
                      setFormSecure(true);
                    }}
                    className={`rounded-lg border p-2 text-xs font-bold transition-all ${
                      formProvider === "godaddy"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-border text-ink-muted"
                    }`}
                  >
                    GoDaddy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormProvider("hostinger");
                      setFormHost("smtp.hostinger.com");
                      setFormPort(465);
                      setFormSecure(true);
                    }}
                    className={`rounded-lg border p-2 text-xs font-bold transition-all ${
                      formProvider === "hostinger"
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                        : "border-border text-ink-muted"
                    }`}
                  >
                    Hostinger
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frank Miller"
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
                  placeholder="e.g. frank@frankmillerconnect.com"
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
                    placeholder="Mailbox password"
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

