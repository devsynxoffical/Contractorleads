"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { MESSAGING_ADDON_PRICE_USD } from "@/lib/messaging-addon";
import { cn } from "@/lib/utils";
import { HiOutlineLockClosed } from "react-icons/hi2";

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
    ok?: boolean;
    error?: string;
    skipped?: boolean;
  }>;
};

export function EmailBulkPanel({
  hasAddon,
  smtpReady,
  onNeedSetup,
}: {
  hasAddon: boolean;
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
      return accs.find((a) => a.isDefault)?.id || accs[0]?.id || "";
    });
  }, []);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/emails/lead-picker?q=${encodeURIComponent(q)}&limit=100`,
      );
      const json = await res.json();
      if (res.ok) setLeads(json.leads ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const allIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

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
    if (!hasAddon) return;
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

  if (!hasAddon) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-800 ring-1 ring-amber-200">
          <HiOutlineLockClosed className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-[16px] font-semibold text-ink">
          Bulk email needs the Messaging add-on
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-muted">
          Send one campaign to up to 200 saved leads at once. Single-lead
          compose stays free with a connected mailbox.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/billing"
            className={buttonVariants({ variant: "default" })}
          >
            Unlock bulk email · ${MESSAGING_ADDON_PRICE_USD.toFixed(2)}/mo
          </Link>
          <Link
            href="/leads/saved"
            className={buttonVariants({ variant: "secondary" })}
          >
            Browse saved leads
          </Link>
        </div>
      </div>
    );
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
      <div className="rounded-2xl border border-border bg-[#faf8fc]/70 px-4 py-3 text-[13px] text-ink-muted">
        Select saved leads with email addresses, write one subject + message,
        and send. Personalization uses each lead&apos;s contact — review copy
        before launching. Cap: 200 per send.
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="saas-input min-w-0 flex-1"
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
          <p className="text-[12px] text-ink-muted">
            {selected.size} selected
            {leads.length ? ` · ${leads.length} shown` : ""}
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">
                Loading leads…
              </p>
            ) : !leads.length ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">
                No saved leads with email.{" "}
                <Link
                  href="/leads/saved"
                  className="font-medium text-brand-600 hover:underline"
                >
                  Open Saved leads
                </Link>
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
                          className="mt-1"
                          checked={on}
                          onChange={() => toggle(l.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {l.businessName}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                            {l.email}
                            {l.city ? ` · ${l.city}` : ""}
                            {l.status ? ` · ${l.status}` : ""}
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

        <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div>
              <p className="text-[15px] font-semibold text-ink">Bulk campaign</p>
              <p className="text-[12px] text-ink-muted">
                Same subject and body to every selected lead.
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700">
                {error}
              </p>
            ) : null}
            {results ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-900">
                Sent {results.sent} · skipped {results.skipped} · failed{" "}
                {results.failed}
                {results.results?.some((r) => r.error) ? (
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[12px]">
                    {results.results
                      .filter((r) => r.error)
                      .slice(0, 8)
                      .map((r) => (
                        <li key={r.leadId}>
                          {r.businessName || r.leadId}: {r.error}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {accounts.length ? (
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
                No mailbox found.{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={onNeedSetup}
                >
                  Setup email
                </button>
              </p>
            )}

            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Subject</span>
              <input
                className="saas-input mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Message</span>
              <Textarea
                className="mt-1 min-h-[180px]"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write your campaign message…"
                disabled={busy}
                required
              />
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="submit"
                loading={busy}
                disabled={
                  busy ||
                  !selected.size ||
                  !accounts.length ||
                  !subject.trim() ||
                  !bodyText.trim()
                }
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
