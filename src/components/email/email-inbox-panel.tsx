"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HiOutlineArrowDownLeft,
  HiOutlineArrowUpRight,
  HiOutlineArrowPath,
  HiOutlineEnvelope,
} from "react-icons/hi2";

type InboxItem = {
  id: string;
  direction: "inbound" | "outbound" | string;
  status: string;
  subject: string;
  preview: string;
  fromEmail: string;
  toEmail: string;
  createdAt: string;
  readAt: string | null;
  lead: {
    id: string;
    businessName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type ThreadMsg = {
  id: string;
  direction: string;
  status: string;
  subject: string;
  body: string;
  fromEmail: string;
  toEmail: string;
  createdAt: string;
  error: string | null;
};

type Account = {
  id: string;
  label: string;
  fromEmail: string;
  isDefault: boolean;
};

export function EmailInboxPanel() {
  const [tab, setTab] = useState<"all" | "inbound" | "outbound">("all");
  const [emails, setEmails] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboundCount, setInboundCount] = useState(0);
  const [outboundCount, setOutboundCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lead, setLead] = useState<InboxItem["lead"]>(null);
  const [subject, setSubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const loadInbox = useCallback(async (currentTab: "all" | "inbound" | "outbound") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emails/inbox?tab=${currentTab}`);
      const json = await res.json();
      if (res.ok) {
        setEmails(json.emails ?? []);
        setUnreadCount(json.unreadCount ?? 0);
        setInboundCount(json.inboundCount ?? 0);
        setOutboundCount(json.outboundCount ?? 0);
        setTotalCount(json.totalCount ?? 0);
      } else {
        setError(json.error || "Failed to load emails");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncMailboxes = useCallback(async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      setMsg(null);
      const res = await fetch("/api/emails/inbox/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.totalSynced > 0) {
        setMsg(`Synced ${data.totalSynced} new incoming email(s) from Hostinger.`);
      }
      await loadInbox(tab);
    } catch {
      // ignore background sync errors
    } finally {
      setSyncing(false);
    }
  }, [loadInbox, tab, syncing]);

  // Load inbox data on mount and tab changes immediately
  useEffect(() => {
    void loadInbox(tab);
  }, [tab, loadInbox]);

  async function openEmail(id: string) {
    setSelectedId(id);
    setMsg(null);
    setError(null);
    setBusy(true);

    // Optimistically mark as read in local list
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, readAt: e.readAt || new Date().toISOString() } : e)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/emails/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to open");
      setThread(json.thread ?? []);
      setAccounts(json.accounts ?? []);
      setLead(json.email?.lead ?? null);
      const sub = json.email?.subject || "(no subject)";
      setSubject(sub.toLowerCase().startsWith("re:") ? sub : `Re: ${sub}`);
      setReplyBody("");
      const def =
        (json.accounts as Account[] | undefined)?.find((a) => a.isDefault) ||
        json.accounts?.[0];
      setSmtpAccountId(def?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open email");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: replyBody,
          subject,
          smtpAccountId: smtpAccountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reply failed");
      setMsg("Reply sent.");
      setReplyBody("");
      await openEmail(selectedId);
      await loadInbox(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setBusy(false);
    }
  }

  const filteredEmails = emails.filter((e) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (e.lead?.businessName && e.lead.businessName.toLowerCase().includes(q)) ||
      e.fromEmail.toLowerCase().includes(q) ||
      e.toEmail.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.preview.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Mailbox &amp; Conversations</h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Track all sent outreach, incoming replies, and full conversation threads.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              tab === "all"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setTab("inbound")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              tab === "inbound"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            Received ({inboundCount})
            {unreadCount > 0 ? (
              <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab("outbound")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              tab === "outbound"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            Sent ({outboundCount})
          </button>
          <button
            type="button"
            onClick={() => syncMailboxes()}
            disabled={syncing}
            title="Sync Hostinger Mailboxes (Fetch new replies)"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
              syncing && "opacity-75 cursor-not-allowed",
            )}
          >
            <HiOutlineArrowPath className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            <span>{syncing ? "Syncing…" : "Sync Mailboxes"}</span>
          </button>
          <button
            type="button"
            onClick={() => loadInbox(tab)}
            title="Refresh List"
            className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink transition"
          >
            <HiOutlineArrowPath className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Left Column: Email list with search */}
        <div className="space-y-2">
          <input
            className="saas-input w-full text-xs"
            placeholder="Filter messages by recipient, subject, or lead…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />

          <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)] shadow-sm">
            {loading ? (
              <p className="px-4 py-12 text-center text-xs text-ink-muted animate-pulse">
                Loading messages…
              </p>
            ) : !filteredEmails.length ? (
              <div className="px-4 py-12 text-center text-xs text-ink-muted space-y-1.5">
                <HiOutlineEnvelope className="mx-auto h-6 w-6 text-ink-faint" />
                <p className="font-semibold text-ink">
                  {tab === "inbound"
                    ? "No received replies yet"
                    : tab === "outbound"
                    ? "No sent emails yet"
                    : "No email activity found"}
                </p>
                <p className="text-[11px] text-ink-faint max-w-xs mx-auto">
                  {tab === "inbound"
                    ? "When a lead or contractor replies to your outreach, their message will appear here."
                    : "Send an email using the Compose tab or open any lead to reach out."}
                </p>
              </div>
            ) : (
              <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
                {filteredEmails.map((e) => {
                  const active = selectedId === e.id;
                  const isInbound = e.direction === "inbound";
                  const unread = isInbound && !e.readAt;

                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => openEmail(e.id)}
                        className={cn(
                          "w-full px-4 py-3 text-left transition",
                          active
                            ? "bg-brand-50/80 border-l-4 border-brand-600"
                            : "hover:bg-[var(--input-bg)]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isInbound ? (
                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                                  <HiOutlineArrowDownLeft className="h-3 w-3" /> Received
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 rounded bg-brand-100 px-1.5 py-0.2 text-[10px] font-semibold text-brand-800">
                                  <HiOutlineArrowUpRight className="h-3 w-3" /> Sent
                                </span>
                              )}
                              <p
                                className={cn(
                                  "truncate text-[13px]",
                                  unread
                                    ? "font-bold text-ink"
                                    : "font-medium text-ink",
                                )}
                              >
                                {e.lead?.businessName || (isInbound ? e.fromEmail : e.toEmail)}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] text-ink-faint">
                            {new Date(e.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-[12px] font-medium text-ink-muted">
                          {e.subject || "(no subject)"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-faint">
                          {e.preview}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Conversation Thread & Reply */}
        <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5 shadow-sm">
          {!selectedId ? (
            <div className="py-16 text-center text-xs text-ink-faint space-y-2">
              <HiOutlineEnvelope className="mx-auto h-8 w-8 text-ink-faint/60" />
              <p className="font-semibold text-ink">Select a conversation</p>
              <p>Click any message on the left to view the complete thread history and send replies.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lead ? (
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <p className="text-[15px] font-semibold text-ink">
                      {lead.businessName}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {lead.email}
                      {lead.phone ? ` · ${lead.phone}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/leads/${lead.id}?from=saved`}
                    className="text-[12px] font-semibold text-brand-600 hover:underline"
                  >
                    Open lead profile →
                  </Link>
                </div>
              ) : null}

              <ul className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                {thread.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "rounded-xl px-3.5 py-3 text-[13px]",
                      m.direction === "inbound"
                        ? "bg-[var(--input-bg)] border border-border/80"
                        : "bg-brand-50 border border-brand-100",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                        {m.direction === "inbound" ? "Received from contact" : "You (Sent)"} ·{" "}
                        {m.status}
                      </span>
                      <span className="text-[10px] text-ink-faint">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-ink">{m.subject}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">
                      {m.body}
                    </p>
                    {m.error ? (
                      <p className="mt-1 text-[12px] text-rose-600">{m.error}</p>
                    ) : null}
                  </li>
                ))}
              </ul>

              <form onSubmit={sendReply} className="space-y-3 border-t border-border pt-3">
                <p className="text-[13px] font-semibold text-ink">Reply to conversation</p>
                {accounts.length > 0 ? (
                  <label className="block text-[12px]">
                    <span className="font-medium text-ink-muted">Send from (Hostinger / Custom SMTP)</span>
                    <select
                      className="saas-input mt-1"
                      value={smtpAccountId}
                      onChange={(e) => setSmtpAccountId(e.target.value)}
                      disabled={busy}
                    >
                      <option value="">
                        ⚡ Auto-Rotate across Hostinger Mailboxes (Recommended)
                      </option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} · {a.fromEmail}
                          {a.isDefault ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="block text-[12px]">
                  <span className="font-medium text-ink-muted">Subject</span>
                  <input
                    className="saas-input mt-1"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="block text-[12px]">
                  <span className="font-medium text-ink-muted">Message</span>
                  <Textarea
                    className="mt-1 min-h-[100px] text-xs"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type your reply message…"
                    disabled={busy}
                    required
                  />
                </label>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={busy || !replyBody.trim()}
                  className="text-xs"
                >
                  Send reply
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
