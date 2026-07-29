"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, LOGO_GRADIENT } from "@/components/layout/page-header";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";
import {
  QUALIFICATION_SCORE_KEYS,
  QUALIFICATION_SCORE_META,
  type QualificationScoreKey,
} from "@/lib/services/qualification-detail-report";
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
}: {
  leadId: string;
  scoreKey: QualificationScoreKey;
  backHref: string;
  /** Prefix for sibling score links, e.g. `/leads/xyz/qualification` */
  basePath: string;
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
            "GPT detailed problem report ready — review before pitching the lead.",
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
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-brand-700"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to {lead?.businessName || "lead"}
        </Link>
      </div>

      <PageHeader
        title={meta.label}
        description={
          lead
            ? `Detailed GPT problem report for ${lead.businessName}${
                lead.website ? ` · ${lead.website.replace(/^https?:\/\//, "")}` : ""
              }`
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
              {report ? "Regenerate with GPT" : "Generate with GPT"}
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
              href={`${basePath}/${key}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                active
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-border bg-white text-ink-muted hover:border-brand-200",
              )}
            >
              {m.shortLabel}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Measured score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl text-white"
              style={{ background: LOGO_GRADIENT }}
            >
              <span className="text-3xl font-bold leading-none">{score}</span>
              <span className="text-[11px] opacity-80">/100</span>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              {meta.description}
            </p>
            <p className="text-[11px] text-ink-faint">
              Uses {creditCost} credit to generate · regenerate re-crawls the
              site and rewrites with GPT.
            </p>
            {lead?.outreachAngle ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 text-[12px] leading-relaxed text-ink">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                  Outreach angle
                </p>
                <p className="mt-1">{lead.outreachAngle}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {report?.title || `${meta.label} — problems & fixes`}
            </CardTitle>
            {report?.createdAt ? (
              <p className="text-[12px] text-ink-muted">
                Updated {new Date(report.createdAt).toLocaleString()}
                {source ? ` · ${source}` : ""}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
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
              <p className="text-[14px] text-ink-muted">
                {generating
                  ? "Crawling the site and writing a GPT detail report…"
                  : "Loading…"}
              </p>
            ) : report ? (
              <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-[#faf8fc] px-4 py-4 text-[13px] leading-relaxed text-ink">
                {report.content}
              </pre>
            ) : (
              <p className="text-[14px] text-ink-muted">
                No detail report yet. Click Generate with GPT.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
