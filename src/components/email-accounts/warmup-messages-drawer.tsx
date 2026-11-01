"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineArrowDownLeft,
  HiOutlineArrowUpRight,
  HiOutlineEnvelopeOpen,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

type Direction = "all" | "sent" | "received";

type WarmupMessageRow = {
  id: string;
  direction: "sent" | "received";
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  body: string | null;
  landed: string;
  rescued: boolean;
  replied: boolean;
  sentAt: string;
};

type WarmupMessagesResponse = {
  counts: { sent: number; received: number; replied: number; spam: number };
  messages: WarmupMessageRow[];
};

const TABS: Array<{ id: Direction; label: string }> = [
  { id: "all", label: "All" },
  { id: "sent", label: "Sent" },
  { id: "received", label: "Received" },
];

/**
 * Shows the warmup emails one mailbox exchanged with the other mailboxes in the warmup pool.
 */
export function WarmupMessagesDrawer({
  mailboxEmail,
  onClose,
}: {
  mailboxEmail: string;
  onClose: () => void;
}) {
  const [direction, setDirection] = useState<Direction>("all");
  const [result, setResult] = useState<{ key: string; data: WarmupMessagesResponse | null; error: string }>({
    key: "",
    data: null,
    error: "",
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const requestKey = `${mailboxEmail}|${direction}`;
  const loading = result.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const key = `${mailboxEmail}|${direction}`;
    fetch(
      `/api/email-accounts/warmup-messages?mailbox=${encodeURIComponent(mailboxEmail)}&direction=${direction}&limit=100`,
    )
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setResult({ key, data: null, error: json.error || "Could not load warmup emails." });
        else setResult({ key, data: json as WarmupMessagesResponse, error: "" });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, data: null, error: "Could not load warmup emails." });
      });
    return () => {
      cancelled = true;
    };
  }, [mailboxEmail, direction]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const counts = result.data?.counts;
  const messages = loading ? [] : (result.data?.messages ?? []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Warmup emails for ${mailboxEmail}`}
        className="flex h-full w-full max-w-xl flex-col border-l border-border bg-[var(--surface)] text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">Warmup emails</h2>
            <p className="mt-0.5 truncate font-mono text-xs text-ink-muted" title={mailboxEmail}>
              {mailboxEmail}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
              Warmup emails go between your own pool mailboxes to build sender reputation. They are
              not sent to leads.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-brand-50 hover:text-ink"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-4">
          {[
            { label: "Sent", value: counts?.sent },
            { label: "Received", value: counts?.received },
            { label: "Replied", value: counts?.replied },
            { label: "Sent, landed in spam", value: counts?.spam },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-[var(--surface-muted)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{s.label}</p>
              <p className="mt-0.5 text-lg font-bold">{s.value ?? "–"}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 border-b border-border px-4 py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDirection(t.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition",
                direction === t.id
                  ? "bg-brand-600 text-white"
                  : "border border-border text-ink-muted hover:bg-brand-50 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-ink-muted">Loading warmup emails…</p>
          ) : result.error ? (
            <p className="py-12 text-center text-sm text-rose-600">{result.error}</p>
          ) : !messages.length ? (
            <div className="py-12 text-center text-sm text-ink-muted">
              <HiOutlineEnvelopeOpen className="mx-auto mb-2 h-7 w-7 text-ink-faint" />
              No warmup emails yet. The warmup runner sends a few per day once the mailbox is enabled.
            </div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m) => {
                const sent = m.direction === "sent";
                const open = openId === m.id;
                return (
                  <li key={m.id} className="rounded-xl border border-border bg-[var(--surface)]">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : m.id)}
                      className="flex w-full items-start gap-3 p-3 text-left"
                      aria-expanded={open}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          sent ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {sent ? (
                          <HiOutlineArrowUpRight className="h-4 w-4" />
                        ) : (
                          <HiOutlineArrowDownLeft className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold">
                            {m.subject || "Warmup email"}
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-faint">
                            {new Date(m.sentAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                          {sent ? "To " : "From "}
                          <span className="font-mono">{sent ? m.toEmail : m.fromEmail}</span>
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              sent ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {sent ? "Sent" : "Received"}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              m.landed === "spam" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {m.landed === "spam" ? (m.rescued ? "Spam, rescued" : "Spam") : `Landed: ${m.landed}`}
                          </span>
                          {m.replied ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Replied
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                    {open ? (
                      <div className="border-t border-border px-4 py-3 text-[13px] leading-relaxed">
                        <p className="break-all font-mono text-[11px] text-ink-faint">
                          {m.fromEmail} → {m.toEmail}
                        </p>
                        {m.body ? (
                          <p className="mt-2 whitespace-pre-wrap text-ink">{m.body}</p>
                        ) : (
                          <p className="mt-2 text-ink-muted">
                            The text of this email was not stored because it was sent before message
                            content was logged. New warmup emails show their full text here.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
