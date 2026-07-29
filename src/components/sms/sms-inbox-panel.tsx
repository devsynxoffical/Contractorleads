"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Thread = {
  leadId: string;
  businessName: string;
  phone: string | null;
  preview: string;
  direction: string;
  status: string;
  createdAt: string;
  unread: boolean;
  lastId: string;
};

type Msg = {
  id: string;
  direction: string;
  status: string;
  body: string;
  fromPhone: string;
  toPhone: string;
  createdAt: string;
  error: string | null;
};

export function SmsInboxPanel({
  hasAddon,
  twilioReady,
}: {
  hasAddon: boolean;
  twilioReady: boolean;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [lead, setLead] = useState<{
    id: string;
    businessName: string;
    phone: string | null;
  } | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInbox = useCallback(async () => {
    const res = await fetch("/api/sms/inbox");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load SMS inbox");
    setThreads(json.threads ?? []);
    setUnreadCount(json.unreadCount ?? 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await loadInbox();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadInbox]);

  async function openThread(leadId: string) {
    setSelectedLeadId(leadId);
    setMsg(null);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/sms?leadId=${encodeURIComponent(leadId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to open");
      setThread(json.thread ?? []);
      setLead(json.lead ?? null);
      setReplyBody("");
      await loadInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLeadId || !replyBody.trim()) return;
    if (!hasAddon) {
      setError("Messaging add-on required to send SMS.");
      return;
    }
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLeadId, body: replyBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setMsg("SMS sent.");
      setReplyBody("");
      await openThread(selectedLeadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-ink-faint">Loading SMS…</p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[13px] font-semibold text-ink">Conversations</p>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {unreadCount} new
            </span>
          ) : null}
        </div>
        {!threads.length ? (
          <p className="px-4 py-10 text-center text-sm text-ink-faint">
            No SMS yet. Compose a text to a saved lead with a phone number.
          </p>
        ) : (
          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
            {threads.map((t) => (
              <li key={t.leadId}>
                <button
                  type="button"
                  onClick={() => void openThread(t.leadId)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                    selectedLeadId === t.leadId && "bg-brand-600/10",
                    t.unread && "font-semibold",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] text-ink">
                      {t.businessName}
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-muted">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="truncate text-[12px] text-ink-muted">
                    {t.direction === "outbound" ? "You: " : ""}
                    {t.preview}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-[var(--surface)] p-4">
        {!selectedLeadId || !lead ? (
          <p className="py-16 text-center text-sm text-ink-faint">
            Select a conversation to read and reply.
          </p>
        ) : (
          <div className="flex h-full min-h-[22rem] flex-col">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
              <div>
                <Link
                  href={`/leads/${lead.id}?from=saved`}
                  className="text-[15px] font-semibold text-ink hover:underline"
                >
                  {lead.businessName}
                </Link>
                <p className="text-[12px] text-ink-muted">{lead.phone}</p>
              </div>
            </div>

            <div className="mb-3 max-h-72 flex-1 space-y-2 overflow-y-auto">
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3.5 py-2 text-[13px]",
                    m.direction === "outbound"
                      ? "ml-auto bg-brand-600 text-white"
                      : "mr-auto bg-black/[0.05] text-ink dark:bg-white/[0.08]",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      m.direction === "outbound"
                        ? "text-white/70"
                        : "text-ink-faint",
                    )}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                    {m.status === "failed" ? " · failed" : ""}
                  </p>
                  {m.error ? (
                    <p className="mt-0.5 text-[10px] text-red-200">{m.error}</p>
                  ) : null}
                </div>
              ))}
            </div>

            {!twilioReady ? (
              <p className="text-[13px] text-amber-700 dark:text-amber-400">
                Twilio is not configured yet. An admin must add credentials
                under Admin → System.
              </p>
            ) : !hasAddon ? (
              <p className="text-[13px] text-ink-muted">
                SMS sending needs the{" "}
                <Link href="/billing?addon=messaging" className="underline">
                  Messaging add-on
                </Link>
                .
              </p>
            ) : (
              <form onSubmit={sendReply} className="space-y-2">
                <Textarea
                  rows={3}
                  placeholder="Type your reply…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  maxLength={1600}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-ink-muted">
                    {replyBody.length}/1600
                  </span>
                  <Button type="submit" loading={busy} disabled={!replyBody.trim()}>
                    Send SMS
                  </Button>
                </div>
              </form>
            )}

            {msg ? <p className="mt-2 text-[13px] text-emerald-700">{msg}</p> : null}
            {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
