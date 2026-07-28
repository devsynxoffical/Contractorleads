"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PickLead = {
  id: string;
  businessName: string;
  email: string | null;
  city: string | null;
  status: string;
};

type Mailbox = { id: string; label: string; fromEmail: string; isDefault: boolean };

export function EmailComposePanel() {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<PickLead[]>([]);
  const [selected, setSelected] = useState<PickLead | null>(null);
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/emails/lead-picker?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (res.ok) setLeads(json.leads ?? []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  async function pick(lead: PickLead) {
    setSelected(lead);
    setError(null);
    setMsg(null);
    // Load mailboxes + any subject default via the lead's send-email GET.
    const res = await fetch(`/api/leads/${lead.id}/send-email`);
    const json = await res.json();
    if (res.ok) {
      const accs: Mailbox[] = (json.accounts ?? []).map((a: Mailbox) => ({
        id: a.id,
        label: a.label,
        fromEmail: a.fromEmail,
        isDefault: a.isDefault,
      }));
      setAccounts(accs);
      setSmtpAccountId(accs.find((a) => a.isDefault)?.id || accs[0]?.id || "");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${selected.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body: bodyText,
          smtpAccountId: smtpAccountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setMsg(`Email sent to ${selected.businessName}.`);
      setSubject("");
      setBodyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-2">
        <input
          className="saas-input"
          placeholder="Search saved leads by name, email, or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
          {!leads.length ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              No saved leads with an email address match. Save leads that have
              contact emails to message them here.
            </p>
          ) : (
            <ul className="max-h-[440px] divide-y divide-border overflow-y-auto">
              {leads.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => pick(l)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition",
                      selected?.id === l.id
                        ? "bg-brand-50"
                        : "hover:bg-[var(--input-bg)]",
                    )}
                  >
                    <p className="truncate text-[13px] font-medium text-ink">
                      {l.businessName}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-muted">
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

      <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5">
        {!selected ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            Pick a lead on the left to compose a new email.
          </p>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <div className="border-b border-border pb-3">
              <p className="text-[15px] font-semibold text-ink">
                {selected.businessName}
              </p>
              <p className="text-[12px] text-ink-muted">{selected.email}</p>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700">
                {error}
              </p>
            ) : null}
            {msg ? (
              <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-800">
                {msg}
              </p>
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
                Add your Resend sender under Setup → Email (API key + from address).
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
                className="mt-1 min-h-[160px]"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write your message…"
                disabled={busy}
                required
              />
            </label>
            <Button
              type="submit"
              loading={busy}
              disabled={busy || !accounts.length || !subject.trim() || !bodyText.trim()}
            >
              Send email
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
