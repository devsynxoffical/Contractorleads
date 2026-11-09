"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineEnvelope,
  HiOutlineEnvelopeOpen,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { UNIBOX_LABELS, getUniboxLabel } from "@/lib/unibox/labels";
import { cn } from "@/lib/utils";

type ThreadRow = {
  id: string;
  campaign: { id: string; name: string; status: string } | null;
  contactEmail: string;
  contactName: string | null;
  mailboxEmail: string;
  subject: string;
  preview: string;
  label: string;
  labelSource: string;
  followUpAt: string | null;
  unread: boolean;
  status: string;
  messageCount: number;
  lastMessageAt: string;
};

type Filters = {
  campaigns: Array<{ id: string; name: string; status: string; threads: number; unread: number }>;
  noCampaign: { threads: number; unread: number };
  totalThreads: number;
  totalUnread: number;
  labels: Array<{ id: string; name: string; color: string; auto: boolean; count: number }>;
  mailboxes: Array<{ email: string; threads: number }>;
};

type ThreadDetail = {
  thread: {
    id: string;
    contactEmail: string;
    contactName: string | null;
    mailboxEmail: string;
    subject: string;
    label: string;
    labelSource: string;
    labelReason: string | null;
    followUpAt: string | null;
    referredEmail: string | null;
    referredName: string | null;
    unread: boolean;
    status: string;
    campaignMatch: string;
  };
  campaign: { id: string; name: string; status: string } | null;
  prospect: { status: string; stopReason: string | null; businessName: string; ownerName: string | null; phone: string | null; city: string | null; state: string | null } | null;
  messages: Array<{ id: string; direction: "inbound" | "outbound"; source: string; fromEmail: string; toEmail: string; subject: string; body: string; at: string; status: string; step?: string | null }>;
  history: Array<{ id: string; oldLabel: string | null; newLabel: string; changeType: string; reason: string | null; at: string }>;
};

const MATCH_LABEL: Record<string, string> = {
  in_reply_to: "Matched by reply headers",
  references: "Matched by thread headers",
  prospect_email: "Matched by prospect email",
  none: "Not linked to a campaign",
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function LabelBadge({ id, className }: { id: string; className?: string }) {
  const l = getUniboxLabel(id);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ring-1", l.badge, className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
      {l.name}
    </span>
  );
}

/** Strip quoted history so each bubble shows what that person wrote. */
function ownText(body: string) {
  const cut = body.search(/\n\s*On .{3,200}?wrote:\s*\n|\n\s*-{2,}\s*Original Message|\n\s*From:\s.+\n\s*(Sent|Date):/i);
  return (cut > 0 ? body.slice(0, cut) : body)
    .split("\n")
    .filter((l) => !/^\s*>/.test(l))
    .join("\n")
    .trim();
}

/**
 * Unibox: every reply from every mailbox in one place, filterable by campaign, label and
 * mailbox, with one label per thread (auto-tagged on arrival, changeable here).
 */
export function UniboxPanel() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string>("");
  const [labels, setLabels] = useState<string[]>([]);
  const [mailbox, setMailbox] = useState("");
  const [q, setQ] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [followUpDue, setFollowUpDue] = useState(false);
  const [archived, setArchived] = useState(false);
  const [labelPanel, setLabelPanel] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [qDebounced, setQDebounced] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (campaignId) p.set("campaign_id", campaignId);
    if (labels.length) p.set("label", labels.join(","));
    if (mailbox) p.set("mailbox_id", mailbox);
    if (qDebounced.trim()) p.set("q", qDebounced.trim());
    if (unreadOnly) p.set("unread", "1");
    if (followUpDue) p.set("follow_up", "due");
    if (archived) p.set("status", "archived");
    p.set("limit", "100");
    return p.toString();
  }, [campaignId, labels, mailbox, qDebounced, unreadOnly, followUpDue, archived]);

  const load = useCallback(async () => {
    const fp = new URLSearchParams();
    if (campaignId) fp.set("campaign_id", campaignId);
    if (archived) fp.set("status", "archived");
    const [t, f] = await Promise.all([
      fetch(`/api/unibox/threads?${query}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/unibox/filters?${fp}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (t) {
      setThreads(t.threads ?? []);
      setTotal(t.total ?? 0);
    }
    if (f) setFilters(f);
    setLoading(false);
  }, [query, campaignId, archived]);

  useEffect(() => {
    // Load now (on the next tick) and refresh every 30 seconds while the Unibox is open.
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const openThread = useCallback(async (id: string) => {
    setSelected(id);
    setDetailLoading(true);
    setReply("");
    const d = await fetch(`/api/unibox/threads/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    setDetail(d);
    setDetailLoading(false);
    if (d) setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  }, []);

  function onSearch(v: string) {
    setQ(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setQDebounced(v), 300);
  }

  async function changeLabel(label: string) {
    if (!detail) return;
    const res = await fetch(`/api/unibox/threads/${detail.thread.id}/label`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label_id: label }),
    });
    if (!res.ok) {
      setNotice({ kind: "error", text: "Could not change the label." });
      return;
    }
    setDetail({ ...detail, thread: { ...detail.thread, label, labelSource: "manual", labelReason: "Set by a team member" } });
    setThreads((prev) => prev.map((t) => (t.id === detail.thread.id ? { ...t, label, labelSource: "manual" } : t)));
    void openThread(detail.thread.id);
    void load();
  }

  async function patchThread(data: { unread?: boolean; status?: string }) {
    if (!detail) return;
    await fetch(`/api/unibox/threads/${detail.thread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (data.status) {
      setSelected(null);
      setDetail(null);
    }
    void load();
  }

  async function sendReply() {
    if (!detail || !reply.trim()) return;
    setSending(true);
    setNotice(null);
    const res = await fetch(`/api/unibox/threads/${detail.thread.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    const j = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setNotice({ kind: "error", text: j.message || j.error || "Reply failed." });
      return;
    }
    setReply("");
    setNotice({ kind: "ok", text: `Reply sent from ${detail.thread.mailboxEmail}.` });
    void openThread(detail.thread.id);
    void load();
  }

  async function syncNow() {
    setSyncing(true);
    setNotice(null);
    const res = await fetch("/api/emails/inbox/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fetchAll: false, limit: 25 }),
    }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    setSyncing(false);
    setNotice(
      res?.ok
        ? { kind: "ok", text: j.totalSynced > 0 ? `${j.totalSynced} new repl${j.totalSynced === 1 ? "y" : "ies"} synced.` : "All mailboxes are up to date." }
        : { kind: "error", text: j.error || "Mailbox sync failed." },
    );
    void load();
  }

  function toggleLabel(id: string) {
    setLabels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const visibleLabels = (filters?.labels ?? UNIBOX_LABELS.map((l) => ({ id: l.id, name: l.name, color: l.color, auto: l.auto, count: 0 }))).filter((l) =>
    l.name.toLowerCase().includes(labelSearch.toLowerCase()),
  );
  const activeCampaign = filters?.campaigns.find((c) => c.id === campaignId);
  const currentLabel = detail ? getUniboxLabel(detail.thread.label) : null;

  return (
    <div className="space-y-4">
      {/* Campaign selector: the fix for "every campaign's replies in one list" */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] md:flex-row md:items-center">
        <div className="flex-1">
          <label htmlFor="unibox-campaign" className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Campaign
          </label>
          <select
            id="unibox-campaign"
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setSelected(null);
              setDetail(null);
            }}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-[var(--surface)] px-3 text-[13px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="">All campaigns ({filters?.totalThreads ?? 0} threads, {filters?.totalUnread ?? 0} unread)</option>
            {filters?.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.status} ({c.threads}{c.unread ? `, ${c.unread} unread` : ""})
              </option>
            ))}
            <option value="none">Not linked to a campaign ({filters?.noCampaign.threads ?? 0})</option>
          </select>
        </div>
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint md:top-[calc(50%+9px)]" aria-hidden />
          <label htmlFor="unibox-search" className="hidden text-[11px] font-bold uppercase tracking-wide text-ink-faint md:block">
            Search
          </label>
          <input
            id="unibox-search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Name, email, subject or text"
            className="h-10 w-full rounded-xl border border-border bg-[var(--surface)] pl-9 pr-3 text-[13px] text-ink focus:border-brand-500 focus:outline-none md:mt-1"
          />
        </div>
        <div className="flex items-end gap-2 md:pt-5">
          <Button size="sm" variant="secondary" onClick={() => void syncNow()} loading={syncing}>
            <HiOutlineArrowPath className="h-4 w-4" /> Sync mailboxes
          </Button>
        </div>
      </div>

      {notice ? (
        <p className={cn("rounded-xl px-3 py-2 text-[13px]", notice.kind === "ok" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300")}>
          {notice.text}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,340px)_minmax(0,1fr)]">
        {/* LEFT: filters */}
        <aside className={cn("space-y-4", selected && "hidden lg:block")}>
          <div className="rounded-2xl border border-border bg-[var(--surface)] p-3">
            <button
              type="button"
              onClick={() => setLabelPanel((v) => !v)}
              className="flex w-full items-center justify-between text-[12px] font-bold uppercase tracking-wide text-ink-faint"
              aria-expanded={labelPanel || labels.length > 0}
            >
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineFunnel className="h-4 w-4" /> Labels {labels.length ? `(${labels.length})` : ""}
              </span>
            </button>
            <div className={cn("mt-2 space-y-1", !labelPanel && "hidden lg:block")}>
              <input
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                placeholder="Search labels"
                aria-label="Search labels"
                className="mb-1 h-8 w-full rounded-lg border border-border bg-[var(--surface)] px-2 text-[12px] text-ink focus:border-brand-500 focus:outline-none"
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[12.5px] font-semibold text-ink hover:bg-slate-50 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={labels.length === 0}
                  onChange={() => setLabels([])}
                  className="h-3.5 w-3.5"
                />
                Select all
              </label>
              {visibleLabels.map((l) => (
                <label key={l.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[12.5px] text-ink hover:bg-slate-50 dark:hover:bg-white/5">
                  <input type="checkbox" checked={labels.includes(l.id)} onChange={() => toggleLabel(l.id)} className="h-3.5 w-3.5" />
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
                  <span className="flex-1">{l.name}</span>
                  <span className="text-[11px] text-ink-faint">{l.count}</span>
                </label>
              ))}
              {labels.length ? (
                <button type="button" onClick={() => setLabels([])} className="mt-1 text-[12px] font-semibold text-brand-600 hover:underline">
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-[var(--surface)] p-3 text-[12.5px] text-ink">
            <label htmlFor="unibox-mailbox" className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Mailbox
            </label>
            <select
              id="unibox-mailbox"
              value={mailbox}
              onChange={(e) => setMailbox(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-[var(--surface)] px-2 text-[12px] text-ink focus:border-brand-500 focus:outline-none"
            >
              <option value="">All mailboxes</option>
              {filters?.mailboxes.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.email} ({m.threads})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 pt-1">
              <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-3.5 w-3.5" /> Unread only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={followUpDue} onChange={(e) => setFollowUpDue(e.target.checked)} className="h-3.5 w-3.5" /> Follow-up due
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="h-3.5 w-3.5" /> Show archived
            </label>
          </div>
        </aside>

        {/* CENTER: thread list */}
        <section className={cn("min-w-0 rounded-2xl border border-border bg-[var(--surface)]", selected && "hidden lg:block")}>
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-[12px] text-ink-muted">
            <span>
              {total} thread{total === 1 ? "" : "s"}
              {activeCampaign ? ` in ${activeCampaign.name}` : campaignId === "none" ? " without a campaign" : ""}
            </span>
          </div>
          <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {loading ? (
              <li className="px-4 py-6 text-center text-[13px] text-ink-faint">Loading replies…</li>
            ) : threads.length === 0 ? (
              <li className="px-4 py-8 text-center text-[13px] text-ink-faint">
                No replies match these filters yet. Replies appear here as mailboxes sync.
              </li>
            ) : (
              threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => void openThread(t.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5",
                      selected === t.id && "bg-brand-50/70 dark:bg-brand-500/10",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", t.unread ? "bg-brand-500" : "bg-transparent")} aria-label={t.unread ? "Unread" : undefined} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-[13.5px] text-ink", t.unread ? "font-bold" : "font-semibold")}>
                            {t.contactName || t.contactEmail}
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-faint">{timeAgo(t.lastMessageAt)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <LabelBadge id={t.label} />
                          {t.campaign ? (
                            <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {t.campaign.name}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-[12.5px] font-medium text-ink">{t.subject}</p>
                        <p className="truncate text-[12px] text-ink-muted">{t.preview}</p>
                        <p className="mt-0.5 truncate text-[11px] text-ink-faint">to {t.mailboxEmail}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* RIGHT: conversation */}
        <section className={cn("min-w-0 rounded-2xl border border-border bg-[var(--surface)]", !selected && "hidden lg:block")}>
          {!selected ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center text-[13px] text-ink-faint">
              <HiOutlineEnvelope className="mb-2 h-8 w-8" />
              Choose a reply to read the conversation, change its label and answer it.
            </div>
          ) : detailLoading && !detail ? (
            <p className="p-6 text-[13px] text-ink-faint">Loading conversation…</p>
          ) : detail ? (
            <div className="flex h-full flex-col">
              <header className="space-y-3 border-b border-border p-4">
                <button type="button" onClick={() => { setSelected(null); setDetail(null); }} className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted lg:hidden">
                  <HiOutlineArrowLeft className="h-4 w-4" /> Back to replies
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-ink">{detail.thread.contactName || detail.thread.contactEmail}</p>
                    <p className="truncate text-[12px] text-ink-muted">
                      {detail.thread.contactEmail} → {detail.thread.mailboxEmail}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="unibox-label" className="sr-only">Label</label>
                    <select
                      id="unibox-label"
                      value={detail.thread.label}
                      onChange={(e) => void changeLabel(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-[var(--surface)] px-2 text-[12.5px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
                    >
                      {UNIBOX_LABELS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => void patchThread({ unread: true })} aria-label="Mark unread">
                      <HiOutlineEnvelopeOpen className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void patchThread({ status: detail.thread.status === "archived" ? "open" : "archived" })} aria-label={detail.thread.status === "archived" ? "Unarchive" : "Archive"}>
                      <HiOutlineArchiveBox className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 text-[12px] sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                    <p className="font-semibold text-ink">
                      <LabelBadge id={detail.thread.label} /> <span className="ml-1 text-ink-faint">({detail.thread.labelSource === "manual" ? "set by you" : "auto"})</span>
                    </p>
                    <p className="mt-1 text-ink-muted">{currentLabel?.nextAction}</p>
                    {detail.thread.labelReason ? <p className="mt-0.5 text-ink-faint">Why: {detail.thread.labelReason}</p> : null}
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                    {detail.campaign ? (
                      <>
                        <p className="font-semibold text-ink">Campaign: {detail.campaign.name}</p>
                        <p className="text-ink-muted">
                          {detail.campaign.status}
                          {detail.prospect ? ` · prospect ${detail.prospect.status}${detail.prospect.stopReason ? ` (${detail.prospect.stopReason})` : ""}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-ink">No campaign linked</p>
                    )}
                    <p className="mt-0.5 text-ink-faint">{MATCH_LABEL[detail.thread.campaignMatch] ?? ""}</p>
                  </div>
                  {detail.thread.followUpAt ? (
                    <p className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                      <HiOutlineCalendarDays className="h-4 w-4" /> Follow up on {new Date(detail.thread.followUpAt).toLocaleDateString()}
                    </p>
                  ) : null}
                  {detail.thread.referredEmail || detail.thread.referredName ? (
                    <p className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-violet-900 dark:bg-violet-500/10 dark:text-violet-200">
                      <HiOutlineUserPlus className="h-4 w-4" />
                      Referred to {detail.thread.referredName ?? ""}
                      {detail.thread.referredEmail ? (
                        <a className="font-semibold underline" href={`mailto:${detail.thread.referredEmail}`}>
                          {detail.thread.referredEmail}
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </header>

              <div className="max-h-[52vh] flex-1 space-y-3 overflow-y-auto p-4">
                {detail.messages.map((m) => (
                  <article
                    key={m.id}
                    className={cn(
                      "max-w-[92%] rounded-2xl border px-4 py-3 text-[13px] leading-relaxed",
                      m.direction === "inbound"
                        ? "border-border bg-[var(--surface)] text-ink"
                        : "ml-auto border-brand-100 bg-brand-50/60 text-ink dark:border-brand-500/20 dark:bg-brand-500/10",
                    )}
                  >
                    <p className="mb-1 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-faint">
                      <span className="font-semibold text-ink-muted">{m.direction === "inbound" ? m.fromEmail : `You (${m.fromEmail})`}</span>
                      {m.step ? <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold dark:bg-white/10">{m.step}</span> : null}
                      <span>{new Date(m.at).toLocaleString()}</span>
                    </p>
                    <p className="whitespace-pre-wrap break-words">{ownText(m.body) || m.body}</p>
                  </article>
                ))}
              </div>

              <div className="border-t border-border p-4">
                <label htmlFor="unibox-reply" className="sr-only">Reply</label>
                <textarea
                  id="unibox-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder={`Reply to ${detail.thread.contactName || detail.thread.contactEmail} from ${detail.thread.mailboxEmail}`}
                  className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-ink-faint">Sent from {detail.thread.mailboxEmail}, threaded with the original email.</p>
                  <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => void sendReply()} loading={sending} disabled={!reply.trim()}>
                    <HiOutlinePaperAirplane className="h-4 w-4" /> Send reply
                  </Button>
                </div>
                {detail.history.length ? (
                  <details className="mt-3 text-[12px] text-ink-muted">
                    <summary className="cursor-pointer font-semibold">Label history ({detail.history.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {detail.history.map((h) => (
                        <li key={h.id}>
                          {new Date(h.at).toLocaleString()}: {h.oldLabel ? `${getUniboxLabel(h.oldLabel).name} → ` : ""}
                          <b>{getUniboxLabel(h.newLabel).name}</b> ({h.changeType === "manual" ? "manual" : "auto"}{h.reason ? `, ${h.reason}` : ""})
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="p-6 text-[13px] text-ink-faint">This conversation could not be loaded.</p>
          )}
        </section>
      </div>
    </div>
  );
}
