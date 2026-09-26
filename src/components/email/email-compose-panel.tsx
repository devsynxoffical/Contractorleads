"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HiOutlineEnvelope,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBookmark,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineUsers,
} from "react-icons/hi2";

type PickLead = {
  id: string;
  businessName: string;
  ownerName?: string | null;
  email: string | null;
  phone?: string | null;
  city: string | null;
  state?: string | null;
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
  domain?: string;
  fromEmail: string;
  fromName?: string | null;
  isDefault?: boolean;
  isSystem?: boolean;
};

const VARS = ["businessName", "city", "industry", "ownerName"];

export function EmailComposePanel() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"lead" | "custom">("lead");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<PickLead[]>([]);
  const [selected, setSelected] = useState<PickLead | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Segment states
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const [segmentLoading, setSegmentLoading] = useState(false);

  // Form states
  const [customTo, setCustomTo] = useState("");
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk modal state for sending to entire segment
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    sent: number;
    skipped: number;
    failed: number;
  } | null>(null);

  // Load saved segments
  const loadSegments = useCallback(async () => {
    try {
      const res = await fetch("/api/segments");
      const json = await res.json();
      if (res.ok && Array.isArray(json.segments)) {
        setSegments(json.segments);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  // Load available senders / Hostinger accounts
  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/smtp-accounts");
      const json = await res.json();
      if (res.ok && json.accounts) {
        setAccounts(json.accounts);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  // Search or fetch leads (by segment or query)
  const fetchLeads = useCallback(
    async (q: string, segmentId?: string) => {
      setLoadingLeads(true);
      try {
        if (segmentId) {
          const res = await fetch(
            `/api/segments/leads?segmentId=${encodeURIComponent(segmentId)}&limit=100`,
          );
          const json = await res.json();
          if (res.ok && Array.isArray(json.leads)) {
            setLeads(json.leads);
            return;
          }
        }

        const res = await fetch(
          `/api/emails/lead-picker?q=${encodeURIComponent(q)}&limit=100`,
        );
        const json = await res.json();
        if (res.ok) setLeads(json.leads ?? []);
      } catch {
        // ignore
      } finally {
        setLoadingLeads(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedSegmentId) {
      void fetchLeads("", selectedSegmentId);
    } else {
      const t = setTimeout(() => void fetchLeads(query), 250);
      return () => clearTimeout(t);
    }
  }, [query, selectedSegmentId, fetchLeads]);

  // Read URL query params on mount
  useEffect(() => {
    const toParam = searchParams.get("to");
    const leadIdParam = searchParams.get("leadId");
    const segmentIdParam = searchParams.get("segmentId");
    const subjectParam = searchParams.get("subject");
    const nameParam = searchParams.get("name") || "";

    if (subjectParam) setSubject(subjectParam);

    if (segmentIdParam) {
      setSelectedSegmentId(segmentIdParam);
    }

    if (leadIdParam) {
      setMode("lead");
      fetch(`/api/emails/lead-picker?leadId=${encodeURIComponent(leadIdParam)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.leads && json.leads[0]) {
            const l = json.leads[0];
            pick(l);
          }
        })
        .catch(() => {});
    } else if (toParam) {
      setMode("custom");
      setCustomTo(toParam);
      if (!subjectParam) {
        setSubject(nameParam ? `Quick intro — ${nameParam}` : "Quick inquiry");
      }
      setBodyText(
        `Hi ${nameParam || "there"},\n\nI wanted to reach out regarding opportunities to collaborate.\n\nWould you be open to a quick chat this week?\n\nBest regards,\n`,
      );
    }
  }, [searchParams]);

  function pick(lead: PickLead) {
    setSelected(lead);
    setCustomTo(lead.email || "");
    setError(null);
    setMsg(null);
    if (!subject || subject.startsWith("Quick inquiry")) {
      setSubject(`Quick inquiry — ${lead.businessName}`);
    }
    if (!bodyText) {
      setBodyText(
        `Hi there,\n\nI came across ${lead.businessName} and wanted to reach out regarding contractor opportunities in your area.\n\nWould you be open to a quick 5-minute chat this week?\n\nBest regards,\n`,
      );
    }
  }

  // Current lead index in list (for Next / Prev navigation)
  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return leads.findIndex((l) => l.id === selected.id);
  }, [selected, leads]);

  function goToNextLead() {
    if (currentIndex >= 0 && currentIndex < leads.length - 1) {
      pick(leads[currentIndex + 1]);
    }
  }

  function goToPrevLead() {
    if (currentIndex > 0) {
      pick(leads[currentIndex - 1]);
    }
  }

  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedSegmentId) || null,
    [segments, selectedSegmentId],
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const recipient = mode === "lead" ? (selected?.email || customTo) : customTo;

    if (!recipient || !recipient.includes("@")) {
      setError("Please provide a valid recipient email address.");
      return;
    }

    if (!subject.trim() || !bodyText.trim()) {
      setError("Subject and message body are required.");
      return;
    }

    setBusy(true);
    setMsg(null);
    setError(null);

    // Replace template tokens if single send with a lead selected
    let compiledBody = bodyText.trim();
    let compiledSubject = subject.trim();
    if (selected) {
      compiledSubject = compiledSubject.replace(
        /\{\{businessName\}\}/g,
        selected.businessName || "",
      );
      compiledBody = compiledBody
        .replace(/\{\{businessName\}\}/g, selected.businessName || "")
        .replace(/\{\{city\}\}/g, selected.city || "your area")
        .replace(/\{\{industry\}\}/g, selected.industry || "contracting")
        .replace(
          /\{\{ownerName\}\}/g,
          selected.ownerName || selected.businessName || "there",
        );
    }

    try {
      const res = await fetch("/api/emails/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipient.trim(),
          subject: compiledSubject,
          body: compiledBody,
          smtpAccountId: smtpAccountId || undefined,
          leadId: selected?.id || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");

      setMsg(`Email successfully sent to ${recipient}!`);

      // Auto-advance to next lead in segment if available
      if (selectedSegmentId && currentIndex >= 0 && currentIndex < leads.length - 1) {
        const next = leads[currentIndex + 1];
        setTimeout(() => {
          pick(next);
        }, 800);
      } else if (mode === "custom") {
        setCustomTo("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkSendSegment() {
    if (!leads.length) return;
    setBulkBusy(true);
    setBulkResult(null);
    setError(null);

    try {
      const leadIds = leads.map((l) => l.id);
      const res = await fetch("/api/leads/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds,
          subject: subject.trim() || "Quick inquiry for {{businessName}}",
          body:
            bodyText.trim() ||
            "Hi {{businessName}},\n\nI wanted to reach out regarding contractor opportunities in {{city}}.\n\nBest regards,",
          smtpAccountId: smtpAccountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Bulk send failed");

      setBulkResult({
        sent: json.sent ?? 0,
        skipped: json.skipped ?? 0,
        failed: json.failed ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk send failed");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)]">
      {/* Left Column: Quick Lead Directory & Segments */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-ink">
              <HiOutlineUser className="h-4 w-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Leads &amp; Segments Directory
              </h3>
            </div>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setCustomTo("");
                }}
                className="text-[11px] font-medium text-rose-600 hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-muted">
            Select a saved segment or individual lead to reach out immediately.
          </p>

          {/* Segment Selector Bar */}
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-2.5">
              <div className="flex items-center justify-between gap-1.5 pb-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-900">
                  <HiOutlineBookmark className="h-3.5 w-3.5 text-brand-600" />
                  Target Segment
                </span>
                {selectedSegmentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSegmentId("");
                    }}
                    className="text-[10px] font-medium text-brand-700 hover:underline"
                  >
                    View all saved leads
                  </button>
                )}
              </div>
              <select
                className="saas-input w-full bg-white text-xs font-medium text-ink shadow-sm"
                value={selectedSegmentId}
                onChange={(e) => {
                  setSelectedSegmentId(e.target.value);
                  setSelected(null);
                }}
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
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-brand-200/60 pt-2">
                  <span className="text-[11px] font-medium text-brand-900">
                    Segment: <strong className="font-semibold">{selectedSegment.name}</strong>
                    {" "}({leads.length} leads with email)
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                  >
                    <HiOutlineUsers className="h-3.5 w-3.5" />
                    Blast this segment
                  </button>
                </div>
              )}
            </div>

            {!selectedSegmentId && (
              <input
                className="saas-input w-full text-xs"
                placeholder="Search leads by name, email, or city…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}

            <div className="overflow-hidden rounded-xl border border-border/80 bg-[#faf8fc]">
              {loadingLeads ? (
                <div className="px-4 py-8 text-center text-xs text-ink-muted">
                  Loading leads…
                </div>
              ) : !leads.length ? (
                <div className="px-4 py-8 text-center text-xs text-ink-muted">
                  <p className="font-semibold text-ink">No matching leads with email</p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {selectedSegmentId
                      ? "This segment currently has no leads with email addresses found in your searches."
                      : "You can type any email address directly in the To: field on the right."}
                  </p>
                </div>
              ) : (
                <ul className="max-h-[380px] divide-y divide-border/60 overflow-y-auto">
                  {leads.map((l, idx) => {
                    const isSelected = selected?.id === l.id;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => pick(l)}
                          className={cn(
                            "w-full px-3.5 py-2.5 text-left transition flex items-center justify-between gap-2",
                            isSelected
                              ? "bg-brand-500/10 border-l-4 border-brand-500"
                              : "hover:bg-white/[0.06]",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-semibold text-ink">
                                {l.businessName}
                              </p>
                              {l.qualityTier && (
                                <span className="rounded bg-brand-100/70 px-1.5 py-0.2 text-[9.5px] font-semibold text-brand-800 capitalize">
                                  {l.qualityTier}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] font-mono text-ink-muted">
                              {l.email}
                              {l.city ? ` · ${l.city}` : ""}
                              {l.industry ? ` · ${l.industry}` : ""}
                            </p>
                          </div>
                          {selectedSegmentId && (
                            <span className="text-[10px] font-mono text-ink-faint shrink-0">
                              #{idx + 1}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 text-xs text-brand-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <HiOutlineSparkles className="h-4 w-4 text-brand-600" />
            Hostinger Delivery Pool &amp; Segments
          </p>
          <p className="text-[11px] text-brand-800 leading-relaxed">
            Pick a segment like <strong>Plumbing — Today</strong> to quickly reach out to newly discovered contractors one-by-one or blast the whole segment at once.
          </p>
        </div>
      </div>

      {/* Right Column: Complete Email Compose Form */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-sm">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="border-b border-border pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <HiOutlineEnvelope className="h-4 w-4 text-brand-600" />
                Compose &amp; Reach Out
              </h3>
              {selected && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                    {selected.businessName}
                  </span>
                  {selectedSegmentId && leads.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={goToPrevLead}
                        disabled={currentIndex <= 0}
                        title="Previous lead in segment"
                        className="rounded p-1 text-ink-muted hover:bg-brand-50 disabled:opacity-30"
                      >
                        <HiOutlineChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-[11px] font-mono text-ink-muted">
                        {currentIndex + 1}/{leads.length}
                      </span>
                      <button
                        type="button"
                        onClick={goToNextLead}
                        disabled={currentIndex >= leads.length - 1}
                        title="Next lead in segment"
                        className="rounded p-1 text-ink-muted hover:bg-brand-50 disabled:opacity-30"
                      >
                        <HiOutlineChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Send personalized emails using Hostinger mailboxes.
            </p>
          </div>

          {msg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-700">
              <HiOutlineXCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Direct To: Input Field */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink">
                To: (Recipient Email Address)
              </label>
              {selected && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setCustomTo("");
                  }}
                  className="text-[11px] text-brand-600 hover:underline"
                >
                  Clear Lead / Type Custom Email
                </button>
              )}
            </div>
            <input
              type="email"
              required
              placeholder="e.g. contractor@gmail.com, owner@plumbing.com"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                if (selected && e.target.value !== selected.email) {
                  setSelected(null);
                }
              }}
              className="saas-input mt-1 w-full text-xs font-mono"
            />
          </div>

          {/* Mailbox Sender Selector */}
          <div>
            <label className="block text-xs font-semibold text-ink">
              Send From (Hostinger SMTP Mailbox)
            </label>
            <select
              className="saas-input mt-1 w-full text-xs"
              value={smtpAccountId}
              onChange={(e) => setSmtpAccountId(e.target.value)}
            >
              <option value="">
                ⚡ Auto-Rotate across 25 Hostinger Mailboxes (Recommended)
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.label} {acc.fromEmail ? `(${acc.fromEmail})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-ink">Subject Line</label>
            <input
              type="text"
              required
              placeholder="e.g. Partnership opportunity / Quick intro for {{businessName}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="saas-input mt-1 w-full text-xs"
            />
          </div>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink">Message Body</label>
              <button
                type="button"
                onClick={() => {
                  const targetName = selected?.businessName || "{{businessName}}";
                  setSubject(`Quick inquiry — ${targetName}`);
                  setBodyText(
                    `Hi ${selected?.ownerName || targetName},\n\nI came across ${targetName} in ${selected?.city || "{{city}}"} and wanted to reach out regarding contractor opportunities in your area.\n\nWould you be open to a brief 5-minute chat this week?\n\nBest regards,`,
                  );
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
              >
                <HiOutlineSparkles className="h-3.5 w-3.5" />
                Use Quick Pitch Template
              </button>
            </div>
            <Textarea
              className="mt-1 min-h-[160px] text-xs font-sans"
              placeholder="Write your email pitch or message here…"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              required
            />

            {/* Variable tags */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/80">
            <p className="text-[11px] text-ink-muted">
              {customTo ? (
                <span>
                  Sending to: <strong className="font-mono text-ink">{customTo}</strong>
                </span>
              ) : (
                <span>Enter recipient above</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {selectedSegmentId && currentIndex >= 0 && currentIndex < leads.length - 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={goToNextLead}
                  className="text-xs gap-1"
                >
                  Next Lead
                  <HiOutlineChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="submit"
                disabled={busy || !customTo.trim() || !subject.trim() || !bodyText.trim()}
                className="bg-brand-600 hover:bg-brand-700 text-white gap-2 text-xs"
              >
                <HiOutlinePaperAirplane className="h-4 w-4" />
                {busy ? "Sending…" : "Send Email Now"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Bulk Blast Modal for Segment */}
      {bulkModalOpen && selectedSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl p-6 space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <HiOutlineUsers className="h-5 w-5 text-brand-600" />
                Reach Out to Segment: {selectedSegment.name}
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Send personalized emails to all <strong>{leads.length}</strong> leads with email addresses in this segment.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-ink">Subject:</span>
                <p className="mt-0.5 rounded-lg border border-border bg-[var(--input-bg)] p-2 font-mono text-[11px] text-ink">
                  {subject || "Quick inquiry for {{businessName}}"}
                </p>
              </div>

              <div>
                <span className="font-semibold text-ink">Mailbox Sender:</span>
                <select
                  className="saas-input mt-1 w-full text-xs"
                  value={smtpAccountId}
                  onChange={(e) => setSmtpAccountId(e.target.value)}
                >
                  <option value="">
                    ⚡ Auto-Rotate across 25 Hostinger Mailboxes (Recommended)
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label} {acc.fromEmail ? `(${acc.fromEmail})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {bulkResult && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700">
                  🎉 Blast complete! Sent: {bulkResult.sent} · Skipped: {bulkResult.skipped} · Failed: {bulkResult.failed}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setBulkModalOpen(false)}
                disabled={bulkBusy}
              >
                {bulkResult ? "Close" : "Cancel"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-brand-600 hover:bg-brand-700 text-white gap-2"
                onClick={handleBulkSendSegment}
                disabled={bulkBusy || !leads.length}
              >
                <HiOutlinePaperAirplane className="h-4 w-4" />
                {bulkBusy ? `Blasting ${leads.length} leads…` : `Send to all ${leads.length} leads`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
