"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EnrollEmailSequenceButton } from "@/components/leads/enroll-email-sequence-button";
import { cn } from "@/lib/utils";
import { HiOutlineEnvelope, HiOutlineLockClosed, HiXMark } from "react-icons/hi2";

type SavedLeadRow = {
  id: string;
  status: string;
  favorite: boolean;
  lead: {
    id: string;
    businessName: string;
    address: string | null;
    email: string | null;
    leadScore: number;
  };
};

type Mailbox = { id: string; label: string; fromEmail: string; isDefault: boolean };

type SendResult = {
  leadId: string;
  businessName: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

const VARS = ["businessName", "firstName", "city", "industry", "myName", "myCompany"];

export function SavedLeadsManager({
  leads,
  hasAddon,
  addonPriceUsd,
  mailboxes,
}: {
  leads: SavedLeadRow[];
  hasAddon: boolean;
  addonPriceUsd: number;
  mailboxes: Mailbox[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [smtpAccountId, setSmtpAccountId] = useState(
    mailboxes.find((m) => m.isDefault)?.id || mailboxes[0]?.id || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    sent: number;
    skipped: number;
    failed: number;
    results: SendResult[];
  } | null>(null);

  const selectableIds = useMemo(
    () => leads.filter((l) => l.lead.email).map((l) => l.lead.id),
    [leads],
  );
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(leadId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
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

  const selectedCount = selected.size;

  return (
    <div className="space-y-3">
      {leads.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-[var(--surface)] px-4 py-3">
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={allSelected}
              onChange={toggleAll}
              disabled={!selectableIds.length}
            />
            {selectedCount > 0 ? `${selectedCount} selected` : "Select all with email"}
          </label>
          {hasAddon ? (
            <Button
              size="sm"
              disabled={selectedCount === 0}
              onClick={() => {
                setResults(null);
                setError(null);
                setComposeOpen(true);
              }}
            >
              <HiOutlineEnvelope className="h-4 w-4" />
              Email {selectedCount || ""} lead{selectedCount === 1 ? "" : "s"}
            </Button>
          ) : (
            <Link
              href="/billing?addon=messaging"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-100"
            >
              <HiOutlineLockClosed className="h-4 w-4" />
              Unlock bulk email · ${addonPriceUsd}/mo
            </Link>
          )}
        </div>
      ) : null}

      <div className="grid gap-3">
        {leads.map((s) => {
          const checked = selected.has(s.lead.id);
          const emailable = Boolean(s.lead.email);
          return (
            <Card
              key={s.id}
              className={cn(
                "border-border shadow-[var(--shadow-card)] transition hover:border-brand-200",
                checked && "border-brand-300 ring-1 ring-brand-200",
              )}
            >
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-brand-600 disabled:opacity-40"
                    checked={checked}
                    onChange={() => toggle(s.lead.id)}
                    disabled={!emailable}
                    title={emailable ? "Select for bulk email" : "No email address"}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${s.lead.id}?from=saved`}
                      className="font-semibold text-ink hover:text-brand-600"
                    >
                      {s.lead.businessName}
                    </Link>
                    <p className="mt-1 text-sm text-ink-muted">{s.lead.address}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{s.status}</Badge>
                  {s.favorite && <Badge variant="brand">Favorite</Badge>}
                  <span className="text-sm font-semibold tabular-nums text-brand-600">
                    Score {s.lead.leadScore}
                  </span>
                  <EnrollEmailSequenceButton
                    savedLeadId={s.id}
                    hasEmail={emailable}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!leads.length && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-ink-muted">
              No saved leads yet. Run a search and save your best matches.
            </CardContent>
          </Card>
        )}
      </div>

      {composeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">
                  Email {selectedCount} lead{selectedCount === 1 ? "" : "s"}
                </h3>
                <p className="text-[12px] text-ink-muted">
                  Personalize with variables — each lead gets their own values.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
              {mailboxes.length ? (
                <label className="block text-[12px]">
                  <span className="font-medium text-ink-muted">Send from</span>
                  <select
                    className="saas-input mt-1"
                    value={smtpAccountId}
                    onChange={(e) => setSmtpAccountId(e.target.value)}
                    disabled={busy}
                  >
                    {mailboxes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} · {m.fromEmail}
                        {m.isDefault ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                  Add an SMTP mailbox under Email &amp; SMTP settings to send.
                </p>
              )}

              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">Subject</span>
                <input
                  className="saas-input mt-1"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Quick question for {{businessName}}"
                  disabled={busy}
                />
              </label>

              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">Message</span>
                <Textarea
                  className="mt-1 min-h-[160px]"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder={"Hi {{firstName}},\n\nI came across {{businessName}} in {{city}} and…\n\n{{myName}}\n{{myCompany}}"}
                  disabled={busy}
                />
              </label>

              <div className="flex flex-wrap gap-1.5">
                {VARS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBodyText((b) => `${b}{{${v}}}`)}
                    className="rounded-md border border-border bg-[var(--input-bg)] px-2 py-1 font-mono text-[11px] text-ink-muted hover:border-brand-200 hover:text-brand-600"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700">
                  {error}
                </p>
              ) : null}

              {results ? (
                <div className="rounded-xl border border-border bg-[var(--input-bg)] px-3 py-3 text-[13px]">
                  <p className="font-semibold text-ink">
                    Sent {results.sent} · Skipped {results.skipped} · Failed{" "}
                    {results.failed}
                  </p>
                  {results.results.some((r) => r.status !== "sent") ? (
                    <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-[12px] text-ink-muted">
                      {results.results
                        .filter((r) => r.status !== "sent")
                        .map((r) => (
                          <li key={r.leadId}>
                            {r.businessName}: {r.status}
                            {r.reason ? ` — ${r.reason}` : ""}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setComposeOpen(false)}
                disabled={busy}
              >
                {results ? "Close" : "Cancel"}
              </Button>
              <Button
                size="sm"
                loading={busy}
                disabled={
                  busy ||
                  !mailboxes.length ||
                  !subject.trim() ||
                  !bodyText.trim() ||
                  selectedCount === 0
                }
                onClick={send}
              >
                Send to {selectedCount}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
