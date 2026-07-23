"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InboxItem = {
  id: string;
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
  const [emails, setEmails] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const loadInbox = useCallback(async () => {
    const res = await fetch("/api/emails/inbox");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load inbox");
    setEmails(json.emails ?? []);
    setUnreadCount(json.unreadCount ?? 0);
  }, []);

  useEffect(() => {
    loadInbox()
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load inbox"),
      )
      .finally(() => setLoading(false));
  }, [loadInbox]);

  async function openEmail(id: string) {
    setSelectedId(id);
    setMsg(null);
    setError(null);
    setBusy(true);
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
      await loadInbox();
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
      await loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="animate-pulse text-sm text-ink-muted">Loading inbox…</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Inbox</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Received replies from leads — open to read and reply from your SMTP
            mailbox.
            {unreadCount > 0 ? (
              <span className="ml-1 font-semibold text-brand-600">
                {unreadCount} unread
              </span>
            ) : null}
          </p>
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
          {!emails.length ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              No received emails yet. When a lead replies to your outreach (via
              the inbound webhook), it shows up here.
            </p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
              {emails.map((e) => {
                const active = selectedId === e.id;
                const unread = !e.readAt;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => openEmail(e.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition",
                        active
                          ? "bg-brand-50"
                          : "hover:bg-[var(--input-bg)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-[13px]",
                            unread
                              ? "font-semibold text-ink"
                              : "font-medium text-ink",
                          )}
                        >
                          {e.lead?.businessName || e.fromEmail}
                        </p>
                        {unread ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                        {e.subject || "(no subject)"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-ink-faint">
                        {e.preview}
                      </p>
                      <p className="mt-1 text-[10px] text-ink-faint">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5">
          {!selectedId ? (
            <p className="py-10 text-center text-sm text-ink-faint">
              Select a message to view the thread and reply.
            </p>
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
                    Open lead →
                  </Link>
                </div>
              ) : null}

              <ul className="max-h-[280px] space-y-3 overflow-y-auto">
                {thread.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-[13px]",
                      m.direction === "inbound"
                        ? "bg-[var(--input-bg)]"
                        : "bg-brand-50",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                        {m.direction === "inbound" ? "Received" : "You"} ·{" "}
                        {m.status}
                      </span>
                      <span className="text-[10px] text-ink-faint">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-ink">{m.subject}</p>
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
                <p className="text-[13px] font-semibold text-ink">Reply</p>
                {accounts.length > 0 ? (
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
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                    Add an SMTP mailbox under Email & SMTP settings to reply.
                  </p>
                )}
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
                    className="mt-1 min-h-[110px]"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type your reply…"
                    disabled={busy}
                    required
                  />
                </label>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={busy || !accounts.length || !replyBody.trim()}
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
