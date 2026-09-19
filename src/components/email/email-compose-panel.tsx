"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "react-icons/hi2";

type PickLead = {
  id: string;
  businessName: string;
  email: string | null;
  city: string | null;
  status: string;
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

export function EmailComposePanel() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"lead" | "custom">("lead");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<PickLead[]>([]);
  const [selected, setSelected] = useState<PickLead | null>(null);

  // Form states
  const [customTo, setCustomTo] = useState("");
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    const toParam = searchParams.get("to");
    const leadIdParam = searchParams.get("leadId");
    const subjectParam = searchParams.get("subject");
    const nameParam = searchParams.get("name") || "";

    if (subjectParam) setSubject(subjectParam);

    if (leadIdParam) {
      setMode("lead");
      fetch(`/api/emails/lead-picker?leadId=${encodeURIComponent(leadIdParam)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.leads && json.leads[0]) {
            const l = json.leads[0];
            setSelected(l);
            setCustomTo(l.email || "");
            if (!subjectParam) {
              setSubject(`Quick inquiry — ${l.businessName}`);
            }
            setBodyText(
              `Hi there,\n\nI came across ${l.businessName} and wanted to reach out regarding contractor opportunities in your area.\n\nWould you be open to a quick 5-minute chat this week?\n\nBest regards,\n`,
            );
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

  const search = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/emails/lead-picker?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (res.ok) setLeads(json.leads ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  function pick(lead: PickLead) {
    setSelected(lead);
    setCustomTo(lead.email || "");
    setError(null);
    setMsg(null);
    setSubject(`Quick inquiry — ${lead.businessName}`);
    setBodyText(
      `Hi there,\n\nI came across ${lead.businessName} and wanted to reach out regarding contractor opportunities in your area.\n\nWould you be open to a quick 5-minute chat this week?\n\nBest regards,\n`,
    );
  }

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

    try {
      const res = await fetch("/api/emails/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipient.trim(),
          subject: subject.trim(),
          body: bodyText.trim(),
          smtpAccountId: smtpAccountId || undefined,
          leadId: selected?.id || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");

      setMsg(`Email successfully sent to ${recipient}!`);
      if (mode === "custom") {
        setCustomTo("");
      }
      setSubject("");
      setBodyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      {/* Left Column: Quick Lead Picker & Directory */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-ink">
              <HiOutlineUser className="h-4 w-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Quick Lead Directory</h3>
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
            Click any lead below to autofill, or write any custom recipient email directly in the compose window.
          </p>

          <div className="mt-3 space-y-2">
            <input
              className="saas-input w-full text-xs"
              placeholder="Search leads by name, email, or city…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="overflow-hidden rounded-xl border border-border/80 bg-[#faf8fc]">
              {!leads.length ? (
                <div className="px-4 py-8 text-center text-xs text-ink-muted">
                  <p className="font-semibold text-ink">No saved leads</p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    You can type any email address directly in the <strong>To:</strong> field on the right.
                  </p>
                </div>
              ) : (
                <ul className="max-h-[380px] divide-y divide-border/60 overflow-y-auto">
                  {leads.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => pick(l)}
                        className={cn(
                          "w-full px-3.5 py-2.5 text-left transition",
                          selected?.id === l.id
                            ? "bg-brand-500/10 border-l-4 border-brand-500"
                            : "hover:bg-white/[0.06]",
                        )}
                      >
                        <p className="truncate text-xs font-semibold text-ink">
                          {l.businessName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-mono text-ink-muted">
                          {l.email}
                          {l.city ? ` · ${l.city}` : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 text-xs text-brand-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <HiOutlineSparkles className="h-4 w-4 text-brand-600" />
            Hostinger Delivery Pool
          </p>
          <p className="text-[11px] text-brand-800 leading-relaxed">
            All outbound emails are automatically routed through verified Hostinger mailboxes. You can type any contractor, partner, or client email address to message them directly.
          </p>
        </div>
      </div>

      {/* Right Column: Complete Email Compose Form */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-sm">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="border-b border-border pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <HiOutlineEnvelope className="h-4 w-4 text-brand-600" />
                Compose Email to Anyone
              </h3>
              {selected && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                  Lead: {selected.businessName}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Send an email to any email address using Hostinger mailboxes.
            </p>
          </div>

          {msg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
              <HiOutlineXCircle className="h-4 w-4 shrink-0" />
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
              placeholder="e.g. contractor@gmail.com, owner@plumbing.com, client@company.com"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                if (selected && e.target.value !== selected.email) {
                  setSelected(null);
                }
              }}
              className="saas-input mt-1 w-full text-xs font-mono"
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Type any email address manually or select a lead from the directory.
            </p>
          </div>

          {/* Mailbox Sender Selector (Hostinger Pool + Custom) */}
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
            <p className="mt-1 text-[11px] text-ink-muted">
              Choose a specific mailbox or auto-rotate across active domains for deliverability.
            </p>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-ink">Subject Line</label>
            <input
              type="text"
              required
              placeholder="e.g. Partnership opportunity / Quick intro"
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
                  const targetName = selected?.businessName || "there";
                  setSubject(`Quick inquiry — ${targetName}`);
                  setBodyText(
                    `Hi ${targetName},\n\nI wanted to reach out regarding opportunities to collaborate in your area.\n\nWould you be open to a brief 5-minute chat this week?\n\nBest regards,`,
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
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/80">
            <p className="text-[11px] text-ink-muted">
              {customTo ? (
                <span>Sending to: <strong className="font-mono text-ink">{customTo}</strong></span>
              ) : (
                <span>Enter a recipient email above</span>
              )}
            </p>
            <Button
              type="submit"
              disabled={busy || !customTo.trim() || !subject.trim() || !bodyText.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white gap-2 text-xs"
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
              {busy ? "Sending via Hostinger…" : "Send Email Now"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
