"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HiOutlineBookmark,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineLightBulb,
  HiOutlineBolt,
  HiOutlineClock,
} from "react-icons/hi2";
import { OUTREACH_HOOKS } from "@/lib/outreach-hooks";

type PickLead = {
  id: string;
  businessName: string;
  ownerName?: string | null;
  email: string | null;
  city: string | null;
  industry?: string | null;
  qualityTier?: string | null;
  leadScore?: number | null;
  status?: string;
};

type Segment = {
  id: string;
  name: string;
  industry: string | null;
  when: string | null;
  tier: string | null;
  strength: string | null;
  q: string | null;
  sort: string | null;
};

type Mailbox = {
  id: string;
  label: string;
  fromEmail: string;
  isDefault: boolean;
  enabled?: boolean;
};

type BulkResult = {
  sent: number;
  skipped: number;
  failed: number;
  results: Array<{
    leadId: string;
    businessName?: string;
    status?: "sent" | "skipped" | "failed";
    reason?: string;
  }>;
};

const VARS = ["businessName", "city", "industry", "ownerName"];

export function EmailBulkPanel({
  smtpReady,
  onNeedSetup,
}: {
  hasAddon?: boolean;
  smtpReady: boolean;
  onNeedSetup: () => void;
}) {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<PickLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkResult | null>(null);

  // Segments state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");

  // Outreach Hook state
  const [activeHookId, setActiveHookId] = useState<number | null>(null);

  // Rotation config state
  const [rotationConfig, setRotationConfig] = useState<{
    strategy: string;
    emailsPerDomain: number;
    delaySeconds: number;
  }>({
    strategy: "even-distribution",
    emailsPerDomain: 2,
    delaySeconds: 2,
  });

  function applyHook(hookId: number) {
    setActiveHookId(hookId);
    const hook = OUTREACH_HOOKS.find((h) => h.id === hookId);
    if (!hook) return;
    setSubject(hook.subject);
    setBodyText(hook.body);
  }

  const loadSegments = useCallback(async () => {
    try {
      const [segRes, rotRes] = await Promise.all([
        fetch("/api/segments").then((r) => r.json()).catch(() => ({})),
        fetch("/api/settings/email-rotation").then((r) => r.json()).catch(() => ({})),
      ]);
      if (Array.isArray(segRes.segments)) setSegments(segRes.segments);
      if (rotRes.config) setRotationConfig(rotRes.config);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/settings/smtp-accounts");
    const json = await res.json();
    if (!res.ok) return;
    const accs: Mailbox[] = (json.accounts ?? []).filter(
      (a: Mailbox) => a.enabled !== false && a.fromEmail,
    );
    setAccounts(accs);
    setSmtpAccountId((prev) => {
      if (prev && accs.some((a) => a.id === prev)) return prev;
      return "";
    });
  }, []);

  const fetchLeads = useCallback(async (q: string, segmentId?: string) => {
    setLoading(true);
    try {
      if (segmentId) {
        const res = await fetch(
          `/api/segments/leads?segmentId=${encodeURIComponent(segmentId)}&limit=200`,
        );
        const json = await res.json();
        if (res.ok && Array.isArray(json.leads)) {
          setLeads(json.leads);
          // Auto-select all leads in the segment
          setSelected(new Set(json.leads.map((l: PickLead) => l.id)));
          return;
        }
      }

      const res = await fetch(
        `/api/emails/lead-picker?q=${encodeURIComponent(q)}&limit=200`,
      );
      const json = await res.json();
      if (res.ok) {
        const list = json.leads ?? [];
        setLeads(list);
        setSelected(new Set(list.map((l: PickLead) => l.id)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedSegmentId) {
      void fetchLeads("", selectedSegmentId);
    } else {
      const t = setTimeout(() => void fetchLeads(query), 250);
      return () => clearTimeout(t);
    }
  }, [query, selectedSegmentId, fetchLeads]);

  const allIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedSegmentId) || null,
    [segments, selectedSegmentId],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  async function send() {
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/leads/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: [...selected],
          subject,
          body: bodyText,
          smtpAccountId: smtpAccountId || undefined,
          rotationStrategy: rotationConfig.strategy,
          emailsPerDomain: rotationConfig.emailsPerDomain,
          delaySeconds: rotationConfig.delaySeconds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Bulk send failed");
      setResults({
        sent: json.sent,
        skipped: json.skipped,
        failed: json.failed,
        results: json.results ?? [],
      });
      if (json.sent > 0) setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk send failed");
    } finally {
      setBusy(false);
    }
  }

  if (!smtpReady) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-10 text-center">
        <h3 className="text-[16px] font-semibold text-ink">
          Connect a mailbox first
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-muted">
          Bulk send uses your Resend or SMTP sender. Add one under Setup email,
          then come back here.
        </p>
        <Button className="mt-4" onClick={onNeedSetup}>
          Setup email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-[#faf8fc]/70 px-4 py-3 text-[13px] text-ink-muted flex flex-wrap items-center justify-between gap-2">
        <span>
          Select a <strong>Segment</strong> or individual leads to launch an automated email blast. Personalize with variables like <code>{"{{businessName}}"}</code> and <code>{"{{city}}"}</code>.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          {/* Segment Selector */}
          <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-900">
                <HiOutlineBookmark className="h-4 w-4 text-brand-600" />
                Target Lead Segment
              </span>
              {selectedSegmentId && (
                <button
                  type="button"
                  onClick={() => setSelectedSegmentId("")}
                  className="text-[11px] font-medium text-brand-700 hover:underline"
                >
                  Clear segment
                </button>
              )}
            </div>
            <select
              className="saas-input w-full bg-white text-xs font-medium text-ink shadow-sm"
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
            >
              <option value="">📁 All Saved Leads (default)</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  🎯 {s.name}
                  {s.industry ? ` · ${s.industry}` : ""}
                  {s.when && s.when !== "all" ? ` (${s.when})` : ""}
                </option>
              ))}
            </select>

            {selectedSegment && (
              <div className="flex items-center justify-between text-[11px] text-brand-900 pt-1">
                <span>
                  Targeting segment: <strong className="font-semibold">{selectedSegment.name}</strong>
                </span>
                <span className="font-semibold text-brand-700">
                  {leads.length} leads with email
                </span>
              </div>
            )}
          </div>

          {!selectedSegmentId && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="saas-input min-w-0 flex-1 text-xs"
                placeholder="Search leads by name, email, or city…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={toggleAll}
                disabled={!allIds.length}
              >
                {allSelected ? "Clear all" : "Select all"}
              </Button>
            </div>
          )}

          {selectedSegmentId && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[12px] font-medium text-ink-muted">
                {selected.size} of {leads.length} leads selected
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={toggleAll}
                disabled={!allIds.length}
                className="text-xs h-7"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">
                Loading leads…
              </p>
            ) : !leads.length ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">
                {selectedSegmentId
                  ? "No leads with email found in this segment."
                  : (
                    <>
                      No saved leads with email.{" "}
                      <Link
                        href="/leads/saved"
                        className="font-medium text-brand-600 hover:underline"
                      >
                        Open Saved leads
                      </Link>
                    </>
                  )}
              </p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {leads.map((l) => {
                  const on = selected.has(l.id);
                  return (
                    <li key={l.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 px-4 py-3 transition",
                          on ? "bg-brand-50" : "hover:bg-[var(--input-bg)]",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 accent-brand-600"
                          checked={on}
                          onChange={() => toggle(l.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="block truncate text-[13px] font-medium text-ink">
                              {l.businessName}
                            </span>
                            {l.qualityTier && (
                              <span className="rounded bg-brand-100/70 px-1.5 py-0.2 text-[9.5px] font-semibold text-brand-800 capitalize">
                                {l.qualityTier}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                            {l.email}
                            {l.city ? ` · ${l.city}` : ""}
                            {l.industry ? ` · ${l.industry}` : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Campaign Form */}
        <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div>
              <p className="text-[15px] font-semibold text-ink flex items-center gap-2">
                <HiOutlineUsers className="h-4 w-4 text-brand-600" />
                Bulk Outreach Campaign
              </p>
              <p className="text-[12px] text-ink-muted">
                Each selected lead receives a personalized email using their specific contact details.
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700">
                {error}
              </p>
            ) : null}
            {results ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-900">
                🎉 Sent {results.sent} · skipped {results.skipped} · failed{" "}
                {results.failed}
                {results.results?.some(
                  (r) => r.status === "skipped" || r.status === "failed",
                ) ? (
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[12px]">
                    {results.results
                      .filter(
                        (r) => r.status === "skipped" || r.status === "failed",
                      )
                      .slice(0, 8)
                      .map((r) => (
                        <li key={r.leadId}>
                          {r.businessName || r.leadId}: {r.reason || r.status}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {/* Mailbox Sender & Rotation */}
            <div>
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">Send from (Hostinger / Custom SMTP)</span>
                <select
                  className="saas-input mt-1 text-xs"
                  value={smtpAccountId}
                  onChange={(e) => setSmtpAccountId(e.target.value)}
                  disabled={busy}
                >
                  <option value="">
                    ⚡ Auto-Rotate across 25 Hostinger Mailboxes (Even Distribution)
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} · {a.fromEmail}
                      {a.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              {!smtpAccountId && (
                <div className="mt-2 rounded-xl border border-brand-200/80 bg-brand-50/40 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-900">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineBolt className="h-4 w-4 text-brand-600" />
                      Rotation &amp; Throttle Engine
                    </span>
                    <Link
                      href="/setup/email"
                      className="text-[10.5px] font-medium text-brand-700 hover:underline"
                    >
                      Configure settings →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-ink-muted">Emails / domain:</span>
                      <input
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
                        className="saas-input mt-0.5 h-7 w-full text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-ink-muted">Delay between sends:</span>
                      <select
                        value={rotationConfig.delaySeconds}
                        onChange={(e) =>
                          setRotationConfig({
                            ...rotationConfig,
                            delaySeconds: Number(e.target.value),
                          })
                        }
                        className="saas-input mt-0.5 h-7 w-full text-xs font-semibold"
                      >
                        <option value={0}>0s (Instant)</option>
                        <option value={1}>1s delay</option>
                        <option value={2}>2s delay (Best)</option>
                        <option value={3}>3s delay</option>
                        <option value={5}>5s delay</option>
                        <option value={10}>10s delay</option>
                      </select>
                    </div>
                  </div>
                  {selected.size > 0 && (
                    <p className="text-[10.5px] text-brand-800 border-t border-brand-200/60 pt-1.5">
                      Distributing <strong>{selected.size}</strong> leads across <strong>25 domains</strong> (~
                      {Math.ceil(selected.size / 25)} emails/domain, ~
                      {Math.round((selected.size * rotationConfig.delaySeconds) / 60)} min total).
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Outreach Hooks Selector */}
            <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <HiOutlineLightBulb className="h-4 w-4 text-amber-500" />
                  Select Outreach Hook / Angle:
                </span>
                <span className="text-[10.5px] text-ink-muted">1-click insert proven angle</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {OUTREACH_HOOKS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => applyHook(h.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition border",
                      activeHookId === h.id
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                        : "bg-white text-brand-900 border-brand-200/80 hover:bg-brand-100/70",
                    )}
                    title={h.shortDesc}
                  >
                    🪝 {h.badge}: {h.label.split(":")[1]?.trim()}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Subject</span>
              <input
                className="saas-input mt-1 text-xs"
                placeholder="e.g. Quick question for {{businessName}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            <label className="block text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-muted">Message</span>
                <button
                  type="button"
                  onClick={() => {
                    setSubject("Quick question for {{businessName}}");
                    setBodyText(
                      "Hi {{ownerName}},\n\nI came across {{businessName}} in {{city}} and wanted to reach out regarding contractor opportunities in your area.\n\nWould you be open to a quick 5-minute chat this week?\n\nBest regards,\n",
                    );
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  <HiOutlineSparkles className="h-3.5 w-3.5" />
                  Use Contractor Template
                </button>
              </div>
              <Textarea
                className="mt-1 min-h-[160px] text-xs font-sans"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder={"Hi {{ownerName}},\n\nI came across {{businessName}} in {{city}} and…\n\nBest regards,"}
                disabled={busy}
                required
              />
            </label>

            {/* Variable tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-ink-muted">Insert tag:</span>
              {VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBodyText((b) => `${b}{{${v}}}`)}
                  className="rounded-md border border-border bg-[var(--input-bg)] px-2 py-0.5 font-mono text-[10.5px] text-ink-muted hover:border-brand-200 hover:text-brand-600"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/80">
              <Button
                type="submit"
                loading={busy}
                disabled={
                  busy ||
                  !selected.size ||
                  !subject.trim() ||
                  !bodyText.trim()
                }
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                Send to {selected.size || 0} lead
                {selected.size === 1 ? "" : "s"}
              </Button>
              <Link
                href="/scripts"
                className={buttonVariants({ variant: "secondary" })}
              >
                Open scripts
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
