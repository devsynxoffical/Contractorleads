"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
} from "react-icons/hi2";
import { Button, Spinner } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink, PageCrumbs } from "@/components/layout/back-nav";
import { PageHeader, LOGO_GRADIENT } from "@/components/layout/page-header";
import { ClientPitchReportView } from "@/components/leads/client-pitch-report-view";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";
import {
  LEAD_FROM_HREF,
  LEAD_FROM_LABEL,
  type AppLeadFrom,
} from "@/lib/nav-context";
import {
  QUALIFICATION_SCORE_KEYS,
  QUALIFICATION_SCORE_META,
  type QualificationScoreKey,
} from "@/lib/services/qualification-detail-report-meta";
import { cn } from "@/lib/utils";

type SavedReport = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
};

type LeadSnapshot = {
  id: string;
  businessName: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  websiteQualityScore: number | null;
  seoOpportunityScore: number | null;
  marketingOpportunityScore: number | null;
  ppcOpportunityScore: number | null;
  outreachAngle: string | null;
};

function scoreValue(lead: LeadSnapshot | null, key: QualificationScoreKey) {
  if (!lead) return 0;
  switch (key) {
    case "websiteQuality":
      return lead.websiteQualityScore ?? 0;
    case "seoOpportunity":
      return lead.seoOpportunityScore ?? 0;
    case "marketingOpportunity":
      return lead.marketingOpportunityScore ?? 0;
    case "ppcOpportunity":
      return lead.ppcOpportunityScore ?? 0;
  }
}

export function QualificationDetailView({
  leadId,
  scoreKey,
  backHref,
  basePath,
  from = "all",
}: {
  leadId: string;
  scoreKey: QualificationScoreKey;
  backHref: string;
  /** Prefix for sibling score links, e.g. `/leads/xyz/qualification` */
  basePath: string;
  from?: AppLeadFrom;
}) {
  const meta = QUALIFICATION_SCORE_META[scoreKey];
  const [lead, setLead] = useState<LeadSnapshot | null>(null);
  const [report, setReport] = useState<SavedReport | null>(null);
  const [creditCost, setCreditCost] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/leads/${leadId}/qualification/${scoreKey}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not load report");
        return;
      }
      setLead(data.lead ?? null);
      setReport(data.report ?? null);
      setCreditCost(
        typeof data.creditCost === "number" ? data.creditCost : 1,
      );
    } catch {
      setError("Could not load report");
    } finally {
      setLoading(false);
    }
  }, [leadId, scoreKey]);

  const generate = useCallback(
    async (force: boolean) => {
      setGenerating(true);
      setError("");
      setStatusMsg(null);
      try {
        const res = await fetch(
          `/api/leads/${leadId}/qualification/${scoreKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 402) {
            setError("Insufficient credits. Purchase more on Billing.");
          } else {
            setError(data.error || "Failed to generate detail report");
          }
          return;
        }
        setReport(data.report ?? null);
        setSource(data.source ?? null);
        if (typeof data.creditsRemaining === "number") {
          notifyCreditsChanged(data.creditsRemaining);
        }
        if (data.source === "cached") {
          setStatusMsg("Showing your saved detailed report.");
        } else if (data.source === "fallback") {
          setStatusMsg(
            "Detailed report built from live audit signals (AI key unavailable).",
          );
        } else {
          setStatusMsg(
            "Detailed problem report ready — review before pitching the lead.",
          );
        }
        // Refresh lead scores from GET
        await load();
      } catch {
        setError("Failed to generate detail report");
      } finally {
        setGenerating(false);
      }
    },
    [leadId, scoreKey, load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || generating || report || autoStarted.current) return;
    autoStarted.current = true;
    void generate(false);
  }, [loading, generating, report, generate]);

  async function copyReport() {
    if (!report?.content) return;
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy");
    }
  }

  const score = scoreValue(lead, scoreKey);

  return (
    <div className="page-pad page-enter space-y-6">
      <div className="space-y-2">
        <BackLink
          href={backHref}
          label={`Back to ${lead?.businessName || "lead"}`}
        />
        <PageCrumbs
          items={[
            { label: "Home", href: "/home" },
            {
              label: LEAD_FROM_LABEL[from].replace(/^Back to /i, ""),
              href: LEAD_FROM_HREF[from],
            },
            {
              label: lead?.businessName || "Lead",
              href: backHref,
            },
            { label: meta.label },
          ]}
        />
      </div>

      <PageHeader
        eyebrow={null}
        title={
          lead
            ? `${meta.label} — ${lead.businessName}`
            : meta.label
        }
        description={
          lead?.website
            ? `Live audit detail · ${lead.website.replace(/^https?:\/\//, "")}`
            : meta.description
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={generating}
              disabled={generating}
              onClick={() => void generate(true)}
            >
              <HiOutlineArrowPath className="mr-1.5 h-3.5 w-3.5" />
              {report ? "Regenerate report" : "Generate report"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!report}
              onClick={() => void copyReport()}
            >
              {copied ? (
                <HiOutlineCheck className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <HiOutlineClipboardDocument className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {QUALIFICATION_SCORE_KEYS.map((key) => {
          const m = QUALIFICATION_SCORE_META[key];
          const active = key === scoreKey;
          return (
            <Link
              key={key}
              href={`${basePath}/${key}?from=${from}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                active
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-border bg-[var(--surface)] text-ink-muted hover:border-brand-200",
              )}
            >
              {m.shortLabel}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="border-b border-border/70 bg-[#faf8fc]/60 pb-4">
            <CardTitle className="text-[15px]">Measured score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div
              className="btn-on-brand flex h-28 w-28 flex-col items-center justify-center rounded-2xl text-white shadow-[var(--shadow-soft)]"
              style={{ background: LOGO_GRADIENT }}
            >
              <span className="text-4xl font-bold leading-none tabular-nums">
                {score}
              </span>
              <span className="mt-1 text-[12px] font-medium opacity-90">
                /100
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-ink-muted">
              {meta.description}
            </p>
            <p className="text-[12px] leading-relaxed text-ink-muted">
              Uses {creditCost} credit to generate. Regenerate re-crawls the
              site and rewrites the report from live signals.
            </p>
            {lead?.outreachAngle ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Outreach angle
                </p>
                <p className="mt-1.5 text-ink">{lead.outreachAngle}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-[#faf8fc]/60 pb-4">
            <CardTitle className="text-[16px] leading-snug sm:text-[17px]">
              {report?.title || `${meta.label} — problems & fixes`}
            </CardTitle>
            {report?.createdAt ? (
              <p className="mt-1 text-[13px] text-ink-muted">
                Updated {new Date(report.createdAt).toLocaleString()}
                {source ? ` · ${source}` : ""}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
                {error}{" "}
                {error.toLowerCase().includes("credit") ? (
                  <Link href="/billing" className="font-semibold underline">
                    Go to Billing
                  </Link>
                ) : null}
              </p>
            ) : null}
            {statusMsg ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
                {statusMsg}
              </p>
            ) : null}
            {loading || generating ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <Spinner className="h-8 w-8 text-brand-600" />
                <p className="text-[14px] font-semibold text-ink">
                  {generating
                    ? "Writing the detail report…"
                    : "Loading report…"}
                </p>
                <p className="max-w-sm text-[13px] text-ink-muted">
                  {generating
                    ? "Crawling the site and drafting a professional problems & fixes document."
                    : "Fetching your saved report."}
                </p>
              </div>
            ) : report ? (
              <div className="max-h-[min(70vh,52rem)] overflow-auto bg-[#f7f5f9]/80 p-1 sm:p-2">
                <ClientPitchReportView content={report.content} />
              </div>
            ) : (
              <p className="py-8 text-center text-[14px] text-ink-muted">
                No detail report yet. Click Generate report.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
