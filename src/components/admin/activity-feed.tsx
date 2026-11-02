"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentArrowDown,
  HiOutlineEnvelope,
  HiOutlineMagnifyingGlass,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

export type FeedKind = "email" | "campaign" | "sms" | "search" | "export" | "credits" | "account";

export const FEED_KINDS: Array<{ id: FeedKind; label: string }> = [
  { id: "email", label: "Emails" },
  { id: "campaign", label: "Campaigns" },
  { id: "sms", label: "SMS" },
  { id: "search", label: "Lead searches" },
  { id: "export", label: "Exports" },
  { id: "credits", label: "Credits" },
  { id: "account", label: "Sign-ins & other" },
];

type FeedEvent = {
  id: string;
  kind: FeedKind;
  at: string;
  title: string;
  detail: string | null;
  status: "ok" | "failed" | "received" | "info";
  error: string | null;
  user: { id: string; email: string; name: string | null; companyName: string | null } | null;
};

const KIND_ICON: Record<FeedKind, typeof HiOutlineEnvelope> = {
  email: HiOutlineEnvelope,
  campaign: HiOutlineMegaphone,
  sms: HiOutlineChatBubbleLeftRight,
  search: HiOutlineMagnifyingGlass,
  export: HiOutlineDocumentArrowDown,
  credits: HiOutlineBanknotes,
  account: HiOutlineArrowRightOnRectangle,
};

const STATUS_LABEL: Record<FeedEvent["status"], string | null> = {
  ok: "Sent",
  failed: "Failed",
  received: "Received",
  info: null,
};

/** Chronological activity: every email, campaign send, SMS, search, export, credit change and sign-in. */
export function ActivityFeed({ userId, period }: { userId?: string; period: string }) {
  const [kinds, setKinds] = useState<FeedKind[]>([]);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<{ key: string; loading: boolean; error: string }>({
    key: "",
    loading: true,
    error: "",
  });

  const query = useCallback(
    (before?: string | null) => {
      const p = new URLSearchParams({ period, limit: "50" });
      if (userId) p.set("userId", userId);
      if (kinds.length) p.set("kinds", kinds.join(","));
      if (before) p.set("before", before);
      return p;
    },
    [period, userId, kinds],
  );

  const key = query().toString();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/user-activity/feed?${key}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) {
          setState({ key, loading: false, error: d.error || "Could not load activity." });
          return;
        }
        setEvents(d.events ?? []);
        setCursor(d.nextCursor ?? null);
        setState({ key, loading: false, error: "" });
      })
      .catch(() => !cancelled && setState({ key, loading: false, error: "Could not load activity." }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loading = state.key !== key || state.loading;

  async function loadMore() {
    if (!cursor) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const r = await fetch(`/api/admin/user-activity/feed?${query(cursor).toString()}`);
      const d = await r.json();
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        return [...prev, ...(d.events ?? []).filter((e: FeedEvent) => !seen.has(e.id))];
      });
      setCursor(d.nextCursor ?? null);
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }

  function toggleKind(k: FeedKind) {
    setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  }

  const csvParams = query();
  csvParams.delete("limit");
  csvParams.set("format", "csv");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
        <button
          type="button"
          onClick={() => setKinds([])}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
            kinds.length === 0
              ? "bg-brand-600 text-white"
              : "border border-border text-ink-muted hover:bg-brand-50 hover:text-ink",
          )}
        >
          Everything
        </button>
        {FEED_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => toggleKind(k.id)}
            aria-pressed={kinds.includes(k.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
              kinds.includes(k.id)
                ? "bg-brand-600 text-white"
                : "border border-border text-ink-muted hover:bg-brand-50 hover:text-ink",
            )}
          >
            {k.label}
          </button>
        ))}
        <a
          href={`/api/admin/user-activity/feed?${csvParams.toString()}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
        >
          <HiOutlineArrowDownTray className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {state.error ? (
        <p className="px-4 py-8 text-sm text-rose-600">{state.error}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {(loading && state.key !== key ? [] : events).map((e) => {
            const Icon = KIND_ICON[e.kind];
            const label = STATUS_LABEL[e.status];
            return (
              <li key={e.id} className="flex gap-3 px-4 py-3 text-[13px]">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    e.status === "failed"
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                      : e.status === "received"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                        : "bg-brand-50 text-brand-600 dark:bg-brand-500/15",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="min-w-0 break-words font-medium text-ink">{e.title}</p>
                    <time className="shrink-0 text-[11.5px] text-ink-faint" dateTime={e.at}>
                      {new Date(e.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                  {e.detail ? (
                    <p className="mt-0.5 break-words text-[12px] leading-relaxed text-ink-muted">{e.detail}</p>
                  ) : null}
                  {e.error ? (
                    <p className="mt-1 break-words rounded-lg bg-rose-50 px-2 py-1 text-[11.5px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {e.error}
                    </p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink-faint">
                    {label ? (
                      <span
                        className={cn(
                          "font-semibold",
                          e.status === "failed"
                            ? "text-rose-600"
                            : e.status === "received"
                              ? "text-emerald-600"
                              : "text-ink-muted",
                        )}
                      >
                        {label}
                      </span>
                    ) : null}
                    {e.user && !userId ? (
                      <Link href={`/admin/activity/${e.user.id}`} className="font-semibold text-brand-600 hover:underline">
                        {e.user.companyName || e.user.name || e.user.email}
                      </Link>
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })}
          {loading && state.key !== key ? (
            <li className="px-4 py-8 text-center text-ink-muted">Loading activity…</li>
          ) : null}
          {!loading && events.length === 0 ? (
            <li className="px-4 py-8 text-center text-ink-muted">No activity in this period.</li>
          ) : null}
        </ul>
      )}

      {cursor && !state.error ? (
        <div className="border-t border-border/60 px-4 py-3 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadMore()}
            className="rounded-xl border border-border px-4 py-2 text-[12px] font-semibold text-ink hover:bg-brand-50 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load older activity"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const PERIOD_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

export function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="saas-input ui-select h-10 w-auto min-w-[10rem] text-sm"
      aria-label="Time period"
    >
      {PERIOD_OPTIONS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
