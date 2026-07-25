"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

type PickLead = {
  id: string;
  businessName: string;
  phone: string | null;
  city: string | null;
  status: string;
};

export function SmsComposePanel({
  hasAddon,
  twilioReady,
}: {
  hasAddon: boolean;
  twilioReady: boolean;
}) {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<PickLead[]>([]);
  const [selected, setSelected] = useState<PickLead | null>(null);
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    const res = await fetch(
      `/api/sms/lead-picker?q=${encodeURIComponent(q)}`,
    );
    const json = await res.json();
    if (res.ok) setLeads(json.leads ?? []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selected.id, body: bodyText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setMsg(`SMS sent to ${selected.businessName}.`);
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
          placeholder="Search saved leads by name, phone, or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
          {!leads.length ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              No saved leads with a phone number match. Save leads that have
              phone numbers first.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(lead);
                      setError(null);
                      setMsg(null);
                    }}
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                      selected?.id === lead.id ? "bg-brand-600/10" : ""
                    }`}
                  >
                    <span className="text-[14px] font-medium text-ink">
                      {lead.businessName}
                    </span>
                    <span className="text-[12px] text-ink-muted">
                      {lead.phone}
                      {lead.city ? ` · ${lead.city}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form
        onSubmit={send}
        className="space-y-3 rounded-xl border border-border bg-[var(--surface)] p-4"
      >
        <div>
          <p className="text-[12px] font-medium text-ink-muted">To</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {selected
              ? `${selected.businessName} · ${selected.phone}`
              : "Select a lead"}
          </p>
        </div>

        {!twilioReady ? (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[13px] text-amber-800 dark:text-amber-300">
            Twilio is not configured. An admin must add Account SID, Auth Token,
            and a From number under Admin → System.
          </p>
        ) : null}

        {!hasAddon ? (
          <p className="rounded-lg bg-black/[0.04] px-3 py-2 text-[13px] text-ink-muted dark:bg-white/[0.06]">
            SMS requires the{" "}
            <Link
              href="/billing?addon=messaging"
              className="font-semibold text-brand-600 underline"
            >
              Messaging add-on ($30/mo)
            </Link>
            .
          </p>
        ) : null}

        <label className="block text-[12px] font-medium text-ink-muted">
          Message
          <Textarea
            className="mt-1.5"
            rows={6}
            placeholder="Hi {{owner}} — quick note about…"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            maxLength={1600}
            disabled={!selected || !hasAddon || !twilioReady}
          />
        </label>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-ink-faint">
            {bodyText.length}/1600 · standard SMS ≈ 160 chars
          </span>
          <Button
            type="submit"
            loading={busy}
            disabled={
              !selected || !bodyText.trim() || !hasAddon || !twilioReady
            }
          >
            Send SMS
          </Button>
        </div>
        {msg ? <p className="text-[13px] text-emerald-700">{msg}</p> : null}
        {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
