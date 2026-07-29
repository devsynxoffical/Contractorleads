"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBookmark,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineExclamationCircle,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { DailyDigestSettings } from "@/components/home/daily-digest-settings";
import type { DigestLead, MorningDigest } from "@/lib/services/morning-digest";

type SmtpAccount = {
  id: string;
  label: string;
  fromEmail: string;
  isDefault: boolean;
};

function tierVariant(tier: string | null): "hot" | "warm" | "nurture" | "default" {
  if (tier === "hot") return "hot";
  if (tier === "warm") return "warm";
  if (tier === "nurture") return "nurture";
  return "default";
}

function defaultEmailBody(lead: DigestLead) {
  return `Hi ${lead.ownerName || "there"},

I came across ${lead.businessName} and thought we might be able to help with more booked jobs.

${lead.outreachAngle ? `${lead.outreachAngle}\n\n` : ""}Happy to share a quick opportunity report covering website, SEO, ads, and local presence — open to a short call this week?

Best,`;
}

function DigestLeadCard({
  lead,
  index,
  emailReady,
  onDone,
}: {
  lead: DigestLead;
  index: number;
  emailReady: boolean;
  onDone: (leadId: string) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0 && Boolean(lead.email));
  const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [subject, setSubject] = useState(`Quick intro — ${lead.businessName}`);
  const [body, setBody] = useState(defaultEmailBody(lead));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(lead.savedLeadId));

  useEffect(() => {
    if (!expanded || !lead.email) return;
    let cancelled = false;
    fetch(`/api/leads/${lead.id}/send-email`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list = (data.accounts as SmtpAccount[] | undefined) ?? [];
        setAccounts(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSmtpAccountId(def.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [expanded, lead.id, lead.email]);

  const handleSave = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/save`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setMsg("Saved to pipeline");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!lead.email) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          smtpAccountId: smtpAccountId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMsg("Email sent — moved to Contacted");
      onDone(lead.id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[12px] font-bold tabular-nums text-brand-600">
              {index + 1}
            </span>
            <h3 className="text-[15px] font-semibold text-ink">{lead.businessName}</h3>
            {lead.qualityTier && (
              <Badge variant={tierVariant(lead.qualityTier)}>{lead.qualityTier}</Badge>
            )}
            {saved && <Badge variant="verified">Saved</Badge>}
          </div>
          <p className="mt-1.5 text-[13px] text-ink-muted">{lead.location}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink">{lead.reason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-ink-muted">
            <span className="font-semibold tabular-nums text-brand-600">
              Score {lead.leadScore}
            </span>
            {lead.email && (
              <span className="inline-flex items-center gap-1">
                <HiOutlineEnvelope className="h-3.5 w-3.5" />
                {lead.email}
              </span>
            )}
            {lead.phone && !lead.email && <span>{lead.phone}</span>}
            {lead.industry && <span>{lead.industry}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/leads/${lead.id}?from=digest`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50/50"
          >
            <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
            Open lead
          </Link>
          {!saved && (
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50/50 disabled:opacity-50"
            >
              <HiOutlineBookmark className="h-4 w-4" />
              Save
            </button>
          )}
          {lead.email && emailReady && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-white shadow-sm"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
              {expanded ? "Hide email" : "Email now"}
            </button>
          )}
        </div>
      </div>

      {expanded && lead.email && (
        <div className="border-t border-border bg-slate-50/60 px-4 py-4 sm:px-5">
          {!emailReady ? (
            <p className="text-[13px] text-ink-muted">
              Connect an outbound mailbox in{" "}
              <Link href="/setup/email" className="font-semibold text-brand-600 hover:underline">
                Email setup
              </Link>{" "}
              to send from here.
            </p>
          ) : (
            <div className="space-y-3">
              {accounts.length > 1 && (
                <div>
                  <Label htmlFor={`smtp-${lead.id}`}>Send from</Label>
                  <select
                    id={`smtp-${lead.id}`}
                    value={smtpAccountId}
                    onChange={(e) => setSmtpAccountId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-[13px]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} ({a.fromEmail})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor={`subject-${lead.id}`}>Subject</Label>
                <Input
                  id={`subject-${lead.id}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`body-${lead.id}`}>Message</Label>
                <Textarea
                  id={`body-${lead.id}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  className="mt-1"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSend} disabled={busy}>
                  {busy ? "Sending…" : "Send & mark contacted"}
                </Button>
                <Link
                  href={`/leads/${lead.id}?from=digest#email`}
                  className="text-[12px] font-semibold text-brand-600 hover:underline"
                >
                  Full email tools on lead page
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {msg && (
        <p
          className={`border-t border-border px-4 py-2 text-[12px] sm:px-5 ${
            msg.includes("failed") || msg.includes("Failed")
              ? "text-red-600"
              : "text-emerald-700"
          }`}
        >
          {msg}
        </p>
      )}
    </article>
  );
}

export function MorningDigestView({ userName }: { userName?: string | null }) {
  const [digest, setDigest] = useState<MorningDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load digest");
      setDigest(data.digest);
      setCompletedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load digest");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleLeads =
    digest?.leads.filter((l) => !completedIds.has(l.id)) ?? [];
  const doneCount = digest ? digest.leads.length - visibleLeads.length : 0;

  return (
    <div className="page-pad page-enter">
      <div className="mx-auto w-full max-w-[820px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/home"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:underline"
            >
              <HiOutlineArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-600">
              Daily Digest
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,1.85rem)] font-semibold tracking-tight text-ink">
              {digest?.greeting ?? "Good morning"}
              {userName ? `, ${userName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 max-w-xl text-[14px] text-ink-muted">
              Subscribe to fresh verified leads by email each morning — then work
              today&apos;s top outreach picks below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-border px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-brand-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <DailyDigestSettings />
        {loading && !digest && (
          <div className="rounded-2xl border border-dashed border-border bg-[#faf8fc] px-6 py-12 text-center text-[13px] text-ink-muted">
            Building your digest…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <HiOutlineExclamationCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {digest && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={`rounded-2xl border px-4 py-3.5 ${
                  digest.emailReady
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-amber-200 bg-amber-50/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  {digest.emailReady ? (
                    <HiOutlineCheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <HiOutlineEnvelope className="h-5 w-5 text-amber-600" />
                  )}
                  <p className="text-[13px] font-semibold text-ink">
                    {digest.emailReady ? "Email connected" : "Connect email"}
                  </p>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  {digest.emailReady
                    ? `${digest.smtpAccountCount} mailbox${digest.smtpAccountCount === 1 ? "" : "es"} ready`
                    : "Add SMTP in setup to send intros from the digest"}
                </p>
                {!digest.emailReady && (
                  <Link
                    href="/setup/email"
                    className="mt-2 inline-block text-[12px] font-semibold text-brand-600 hover:underline"
                  >
                    Set up email →
                  </Link>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-[var(--surface)] px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  Today&apos;s picks
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-semibold tabular-nums text-ink">
                  {visibleLeads.length}
                </p>
                <p className="text-[12px] text-ink-muted">
                  of {digest.leads.length} recommended
                </p>
              </div>

              <Link
                href="/leads/hot"
                className="block rounded-2xl border border-[color:var(--border-strong)] bg-[var(--surface)] px-4 py-3.5 transition hover:border-brand-300 hover:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                  Outreach queue
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-semibold tabular-nums text-ink">
                  {digest.hotCount}
                </p>
                <p className="text-[12px] text-ink-muted">
                  hot leads · open full list →
                </p>
              </Link>
            </div>

            {doneCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-[13px] text-emerald-800">
                <HiOutlineCheckCircle className="h-4 w-4" />
                {doneCount} lead{doneCount === 1 ? "" : "s"} emailed this session — nice work.
              </div>
            )}

            <div className="space-y-3">
              {visibleLeads.map((lead, i) => (
                <DigestLeadCard
                  key={lead.id}
                  lead={lead}
                  index={i}
                  emailReady={digest.emailReady}
                  onDone={(id) => setCompletedIds((prev) => new Set(prev).add(id))}
                />
              ))}

              {!visibleLeads.length && (
                <div className="rounded-2xl border border-dashed border-border bg-[#faf8fc] px-6 py-12 text-center">
                  <HiOutlineSparkles className="mx-auto h-8 w-8 text-brand-400" />
                  <p className="mt-3 text-[14px] font-semibold text-ink">
                    {digest.leads.length
                      ? "All done for today"
                      : "No digest leads yet"}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {digest.leads.length
                      ? "You've worked through today's recommendations."
                      : "Run Lead Finder to generate hot leads with email, then check back tomorrow."}
                  </p>
                  <Link
                    href="/leads/search"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    Open Lead Finder
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
