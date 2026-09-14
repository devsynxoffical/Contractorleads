"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmailVerificationResult } from "@/lib/email-verifier";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineArrowDownTray,
  HiOutlineClipboardDocument,
  HiOutlinePaperAirplane,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineServerStack,
  HiOutlineEnvelope,
  HiOutlineUserGroup,
} from "react-icons/hi2";

type ActiveTab = "single" | "bulk";

export function EmailVerifierView() {
  const [tab, setTab] = useState<ActiveTab>("single");

  // Single verify state
  const [singleEmail, setSingleEmail] = useState("");
  const [singleResult, setSingleResult] = useState<EmailVerificationResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Bulk verify state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<EmailVerificationResult[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkFilter, setBulkFilter] = useState<"all" | "valid" | "risky" | "invalid">("all");
  const [bulkSearch, setBulkSearch] = useState("");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Single verify handler
  async function verifySingle(emailToVerify?: string) {
    const target = (emailToVerify || singleEmail).trim();
    if (!target) return;
    setSingleLoading(true);
    setSingleError(null);
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      setSingleResult(data.result);
      if (emailToVerify) setSingleEmail(emailToVerify);
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Failed to verify email");
    } finally {
      setSingleLoading(false);
    }
  }

  // Handle sample click
  function testSample(sample: string) {
    setSingleEmail(sample);
    void verifySingle(sample);
  }

  // Copy helper
  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Bulk verify handler
  async function runBulkVerify() {
    const lines = bulkInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.includes("@"));

    const uniqueEmails = [...new Set(lines)];
    if (!uniqueEmails.length) {
      setBulkError("Please enter or paste at least one valid email address format.");
      return;
    }

    if (uniqueEmails.length > 200) {
      setBulkError("Maximum 200 emails per batch. Please reduce your list.");
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkResults([]);
    setProgress({ current: 0, total: uniqueEmails.length });

    try {
      // Process in small batches of 15 for live progress feeling
      const batchSize = 15;
      const allResults: EmailVerificationResult[] = [];

      for (let i = 0; i < uniqueEmails.length; i += batchSize) {
        const chunk = uniqueEmails.slice(i, i + batchSize);
        const res = await fetch("/api/email/verify-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: chunk }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Bulk verification failed");
        }
        allResults.push(...(data.results || []));
        setBulkResults([...allResults]);
        setProgress({ current: Math.min(i + batchSize, uniqueEmails.length), total: uniqueEmails.length });
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Bulk verification failed");
    } finally {
      setBulkLoading(false);
      setProgress(null);
    }
  }

  // Handle CSV file upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Extract all potential email addresses from CSV/text
      const emailMatches = text.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g) || [];
      const clean = [...new Set(emailMatches)].join("\n");
      setBulkInput(clean);
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  }

  // Export clean CSV
  function exportCleanCsv(onlyValid = false) {
    const listToExport = onlyValid
      ? bulkResults.filter((r) => r.status === "valid")
      : bulkResults;

    if (!listToExport.length) return;

    const headers = ["Email", "Status", "Score", "Verdict", "Domain", "MX Server", "Is Free", "Is Role", "SMTP Handshake"];
    const rows = listToExport.map((r) => [
      `"${r.email}"`,
      `"${r.status}"`,
      r.score,
      `"${r.verdict.replace(/"/g, '""')}"`,
      `"${r.domain}"`,
      `"${r.mxRecords[0]?.host || "none"}"`,
      r.checks.isFreeProvider ? "Yes" : "No",
      r.checks.isRoleBased ? "Yes" : "No",
      `"${r.checks.smtpCheck}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `verified_emails_${onlyValid ? "valid_only_" : ""}${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Bulk stats calculation
  const bulkStats = useMemo(() => {
    const total = bulkResults.length;
    const valid = bulkResults.filter((r) => r.status === "valid").length;
    const risky = bulkResults.filter((r) => r.status === "risky").length;
    const invalid = bulkResults.filter((r) => r.status === "invalid").length;
    const rate = total > 0 ? Math.round(((valid + risky * 0.5) / total) * 100) : 0;
    return { total, valid, risky, invalid, rate };
  }, [bulkResults]);

  // Filtered bulk list
  const filteredBulkResults = useMemo(() => {
    return bulkResults.filter((r) => {
      if (bulkFilter !== "all" && r.status !== bulkFilter) return false;
      if (bulkSearch) {
        const q = bulkSearch.toLowerCase();
        return r.email.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q) || r.verdict.toLowerCase().includes(q);
      }
      return true;
    });
  }, [bulkResults, bulkFilter, bulkSearch]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Feature Callout */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-brand-900/10 via-[var(--surface)] to-brand-900/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              <HiOutlineSparkles className="h-3.5 w-3.5" /> 100% Free for Everyone
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Real-Time Email Verification & Deliverability Check
            </h2>
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">
              Validate contractor and customer emails instantly before sending. Performs RFC syntax checking, DNS MX lookups, disposable email filtering, role-based detection, and live SMTP mailbox handshakes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/inbox?tab=bulk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <HiOutlineEnvelope className="h-4 w-4" />
              Send Free Bulk Email
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-2xl border border-border bg-[var(--surface)] p-1.5 shadow-sm max-w-md">
        <button
          type="button"
          onClick={() => setTab("single")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition",
            tab === "single"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
          )}
        >
          <HiOutlineShieldCheck className="h-4 w-4" />
          Single Email Verifier
        </button>
        <button
          type="button"
          onClick={() => setTab("bulk")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition",
            tab === "bulk"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
          )}
        >
          <HiOutlineUserGroup className="h-4 w-4" />
          Bulk Email Verifier
        </button>
      </div>

      {/* TAB 1: SINGLE VERIFIER */}
      {tab === "single" && (
        <div className="space-y-6">
          <Card className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <CardContent className="p-6 space-y-4">
              <label className="block text-[13px] font-semibold text-ink">
                Enter Email Address to Verify
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="e.g. mike@contractorpro.com or john.doe@gmail.com"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void verifySingle();
                      }
                    }}
                    className="h-12 text-[14.5px] pl-4 pr-10 rounded-xl"
                  />
                  {singleEmail && (
                    <button
                      type="button"
                      onClick={() => setSingleEmail("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => verifySingle()}
                  disabled={singleLoading || !singleEmail.trim()}
                  className="h-12 px-6 rounded-xl text-[14px] font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                  {singleLoading ? (
                    <>
                      <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <HiOutlineShieldCheck className="mr-2 h-5 w-5" />
                      Verify Email
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Test Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] text-ink-muted">
                <span className="font-medium">Try example:</span>
                <button
                  type="button"
                  onClick={() => testSample("contact@google.com")}
                  className="rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 font-mono text-[11.5px] text-ink hover:border-brand-400 hover:text-brand-600 transition"
                >
                  contact@google.com
                </button>
                <button
                  type="button"
                  onClick={() => testSample("fakeuser@mailinator.com")}
                  className="rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 font-mono text-[11.5px] text-ink hover:border-brand-400 hover:text-brand-600 transition"
                >
                  fakeuser@mailinator.com (Disposable)
                </button>
                <button
                  type="button"
                  onClick={() => testSample("mike@gmial.com")}
                  className="rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 font-mono text-[11.5px] text-ink hover:border-brand-400 hover:text-brand-600 transition"
                >
                  mike@gmial.com (Typo)
                </button>
              </div>

              {singleError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-900 flex items-center gap-2.5">
                  <HiOutlineXCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span>{singleError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Single Result Presentation */}
          {singleResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Verdict Header Card */}
              <Card
                className={cn(
                  "border shadow-[var(--shadow-card)] overflow-hidden",
                  singleResult.status === "valid"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : singleResult.status === "risky"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-rose-200 bg-rose-50/40",
                )}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm text-2xl",
                          singleResult.status === "valid"
                            ? "bg-emerald-500 text-white"
                            : singleResult.status === "risky"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white",
                        )}
                      >
                        {singleResult.status === "valid" ? (
                          <HiOutlineCheckCircle className="h-8 w-8" />
                        ) : singleResult.status === "risky" ? (
                          <HiOutlineExclamationTriangle className="h-8 w-8" />
                        ) : (
                          <HiOutlineXCircle className="h-8 w-8" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-ink break-all">
                            {singleResult.email}
                          </h3>
                          <Badge
                            className={cn(
                              "capitalize text-[12px] px-2.5 py-0.5 font-bold tracking-wide",
                              singleResult.status === "valid"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : singleResult.status === "risky"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-rose-100 text-rose-800 border-rose-300",
                            )}
                          >
                            {singleResult.status === "valid"
                              ? "Deliverable"
                              : singleResult.status === "risky"
                                ? "Risky"
                                : "Undeliverable"}
                          </Badge>
                        </div>
                        <p className="text-[14px] font-medium text-ink-muted">
                          {singleResult.verdict}
                        </p>
                      </div>
                    </div>

                    {/* Deliverability Score Dial */}
                    <div className="flex items-center gap-4 border-t border-border pt-4 md:border-t-0 md:pt-0">
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                          Quality Score
                        </p>
                        <p
                          className={cn(
                            "text-3xl font-black tabular-nums tracking-tight",
                            singleResult.score >= 80
                              ? "text-emerald-700"
                              : singleResult.score >= 50
                                ? "text-amber-700"
                                : "text-rose-700",
                          )}
                        >
                          {singleResult.score}
                          <span className="text-sm font-normal text-ink-muted">/100</span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyText(singleResult.email)}
                          className="h-8 text-xs font-semibold"
                        >
                          <HiOutlineClipboardDocument className="mr-1.5 h-3.5 w-3.5" />
                          {copied ? "Copied!" : "Copy Email"}
                        </Button>
                        <Link
                          href={`/inbox?tab=compose&to=${encodeURIComponent(singleResult.email)}`}
                          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                        >
                          <HiOutlinePaperAirplane className="mr-1.5 h-3.5 w-3.5" />
                          Send Email
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion Banner */}
                  {singleResult.suggestion && (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-100/70 p-3.5 flex items-center justify-between gap-3 text-[13px] text-amber-950">
                      <div className="flex items-center gap-2">
                        <HiOutlineSparkles className="h-5 w-5 text-amber-700 shrink-0" />
                        <span>
                          Did you mean <strong className="font-semibold">{singleResult.suggestion}</strong>?
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => testSample(singleResult.suggestion!)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-3"
                      >
                        Verify Suggested
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Breakdown Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <CheckCard
                  title="Syntax & RFC 5322"
                  ok={singleResult.checks.formatValid}
                  okText="Valid email format"
                  badText="Malformed syntax"
                  detail={`User: ${singleResult.user} | Domain: ${singleResult.domain}`}
                />
                <CheckCard
                  title="Domain DNS & MX"
                  ok={singleResult.checks.mxFound}
                  okText="Mail exchange active"
                  badText="No MX / DNS records"
                  detail={
                    singleResult.mxRecords.length
                      ? `Primary: ${singleResult.mxRecords[0].host}`
                      : "Host unreachable"
                  }
                />
                <CheckCard
                  title="Mailbox Handshake"
                  ok={singleResult.checks.smtpCheck !== "failed"}
                  warn={singleResult.checks.smtpCheck === "unreachable"}
                  okText={
                    singleResult.checks.smtpCheck === "passed"
                      ? "Mailbox verified exists"
                      : singleResult.checks.smtpCheck === "unreachable"
                        ? "Server active (Greylisted)"
                        : "Handshake verified"
                  }
                  badText="Mailbox rejected by server"
                  detail={`Response time: ${singleResult.durationMs}ms`}
                />
                <CheckCard
                  title="Disposable Email Check"
                  ok={!singleResult.checks.isDisposable}
                  okText="Genuine permanent domain"
                  badText="Temporary burner address"
                  detail={singleResult.checks.isDisposable ? "Flagged in blocklist" : "Clean domain reputation"}
                />
                <CheckCard
                  title="Account Type"
                  ok={!singleResult.checks.isRoleBased}
                  okText="Individual person / owner"
                  badText="Role address (admin/info)"
                  detail={
                    singleResult.checks.isRoleBased
                      ? "Generic department address"
                      : "Direct personal contact"
                  }
                />
                <CheckCard
                  title="Provider Type"
                  ok={true}
                  okText={
                    singleResult.checks.isFreeProvider
                      ? "Free Webmail (Gmail/Yahoo/etc)"
                      : "Custom Business Domain"
                  }
                  badText=""
                  detail={
                    singleResult.checks.isFreeProvider
                      ? "Public email service"
                      : "Corporate contractor domain"
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK VERIFIER */}
      {tab === "bulk" && (
        <div className="space-y-6">
          <Card className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-[14px] font-semibold text-ink">
                    Paste Email List or Upload CSV
                  </label>
                  <p className="text-[12.5px] text-ink-muted">
                    Paste one email per line (or comma/tab separated), up to 200 emails at a time.
                  </p>
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-border bg-[var(--input-bg)] px-3.5 py-2 text-xs font-semibold text-ink hover:bg-border transition shadow-sm">
                    <HiOutlineDocumentText className="h-4 w-4 text-brand-600" />
                    Upload CSV / Text
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <Textarea
                rows={6}
                placeholder={"john@contracting.com\nsarah@builders.org\ninfo@paintpros.net\nfake@mailinator.com"}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="font-mono text-[13px] rounded-xl"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-ink-muted">
                  {bulkInput.split(/[\n,;]+/).filter((s) => s.trim().includes("@")).length} emails detected
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkInput("");
                      setBulkResults([]);
                    }}
                    disabled={bulkLoading || (!bulkInput && !bulkResults.length)}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={runBulkVerify}
                    disabled={bulkLoading || !bulkInput.trim()}
                    className="bg-brand-600 text-white hover:bg-brand-700 font-semibold shadow-sm"
                  >
                    {bulkLoading ? (
                      <>
                        <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                        Verifying {progress ? `(${progress.current}/${progress.total})` : "…"}
                      </>
                    ) : (
                      <>
                        <HiOutlineShieldCheck className="mr-2 h-4 w-4" />
                        Verify All Emails
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {progress && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-ink">
                    <span>Processing email batch…</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-900 flex items-center gap-2.5">
                  <HiOutlineXCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span>{bulkError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Results Table & KPIs */}
          {bulkResults.length > 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Stats KPI Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                    Total Verified
                  </p>
                  <p className="mt-1 text-2xl font-bold text-ink">{bulkStats.total}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">100% processed</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Deliverable (Valid)
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">{bulkStats.valid}</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {Math.round((bulkStats.valid / bulkStats.total) * 100)}% of list
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Risky (Review)
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">{bulkStats.risky}</p>
                  <p className="mt-0.5 text-xs text-amber-800">Role / Greylist</p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                    Undeliverable
                  </p>
                  <p className="mt-1 text-2xl font-bold text-rose-900">{bulkStats.invalid}</p>
                  <p className="mt-0.5 text-xs text-rose-700">Do not send</p>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-900">
                    List Health
                  </p>
                  <p className="mt-1 text-2xl font-bold text-brand-900">{bulkStats.rate}%</p>
                  <p className="mt-0.5 text-xs text-brand-700">Overall Deliverability</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-ink-muted">Filter:</span>
                  {(["all", "valid", "risky", "invalid"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBulkFilter(filter)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition",
                        bulkFilter === filter
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-[var(--input-bg)] text-ink-muted hover:text-ink",
                      )}
                    >
                      {filter} (
                      {filter === "all"
                        ? bulkStats.total
                        : filter === "valid"
                          ? bulkStats.valid
                          : filter === "risky"
                            ? bulkStats.risky
                            : bulkStats.invalid}
                      )
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Search results…"
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    className="h-8 text-xs w-44 rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportCleanCsv(true)}
                    className="h-8 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    <HiOutlineArrowDownTray className="mr-1.5 h-3.5 w-3.5" />
                    Export Valid CSV ({bulkStats.valid})
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => exportCleanCsv(false)}
                    className="h-8 text-xs font-semibold"
                  >
                    <HiOutlineArrowDownTray className="mr-1.5 h-3.5 w-3.5" />
                    Export All
                  </Button>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-border bg-[var(--input-bg)] text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      <tr>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Diagnostic Verdict</th>
                        <th className="py-3 px-4">Mail Server (MX)</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBulkResults.map((r, i) => (
                        <tr key={i} className="hover:bg-brand-50/30 transition">
                          <td className="py-3 px-4 font-mono font-medium text-ink">
                            {r.email}
                            {r.suggestion && (
                              <p className="text-[11px] text-amber-700 font-sans mt-0.5">
                                Typo: Suggest {r.suggestion}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={cn(
                                "capitalize text-[11px] px-2 py-0.5 font-bold",
                                r.status === "valid"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : r.status === "risky"
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-rose-100 text-rose-800 border-rose-300",
                              )}
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-bold tabular-nums">
                            <span
                              className={cn(
                                r.score >= 80
                                  ? "text-emerald-700"
                                  : r.score >= 50
                                    ? "text-amber-700"
                                    : "text-rose-700",
                              )}
                            >
                              {r.score}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink-muted max-w-xs truncate">
                            {r.verdict}
                          </td>
                          <td className="py-3 px-4 text-ink-faint font-mono text-[11px] max-w-xs truncate">
                            {r.mxRecords[0]?.host || "None"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSingleEmail(r.email);
                                setSingleResult(r);
                                setTab("single");
                              }}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckCard({
  title,
  ok,
  warn,
  okText,
  badText,
  detail,
}: {
  title: string;
  ok: boolean;
  warn?: boolean;
  okText: string;
  badText: string;
  detail: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition",
        ok && !warn
          ? "border-emerald-200/80 bg-emerald-50/40"
          : warn
            ? "border-amber-200/80 bg-amber-50/40"
            : "border-rose-200/80 bg-rose-50/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-faint">
          {title}
        </p>
        {ok && !warn ? (
          <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
        ) : warn ? (
          <HiOutlineExclamationTriangle className="h-4 w-4 text-amber-600" />
        ) : (
          <HiOutlineXCircle className="h-4 w-4 text-rose-600" />
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-[13.5px] font-bold",
          ok && !warn ? "text-emerald-800" : warn ? "text-amber-900" : "text-rose-800",
        )}
      >
        {ok ? okText : badText}
      </p>
      <p className="mt-1 text-[12px] text-ink-muted truncate">{detail}</p>
    </div>
  );
}
