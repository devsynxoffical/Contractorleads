"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineDocumentArrowUp,
  HiOutlineStopCircle,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { parseExcelBuffer, parseSpreadsheetText, type ParsedLead } from "@/lib/spreadsheet-parser";

type Target = "owner" | "work_email" | "phone" | "mobile";

type ProviderInfo = { id: string; name: string; paid: boolean; async: boolean };
type ProvidersResponse = {
  feePerRow: number;
  creditsRemaining: number;
  targets: Array<{ id: Target; label: string; providers: ProviderInfo[] }>;
};

type Accepted = {
  value: string;
  provider: string;
  status?: string;
  verifiedBy?: string | null;
  checkedAt: string;
  sourceUrl?: string | null;
  evidence?: string | null;
  preExisting: boolean;
};

type RowView = {
  id: string;
  rowIndex: number;
  status: string;
  charged: number;
  lastError: string | null;
  input: { businessName: string; website?: string | null; ownerName?: string | null; email?: string | null; phone?: string | null };
  result: Partial<Record<Target, Accepted>> & { ownerTitle?: string | null; emailForReview?: Accepted | null };
  tracks: Partial<Record<Target, { outcome?: string; reason?: string }>>;
  attempts: Array<{
    provider: string;
    providerName: string;
    target: Target;
    status: string;
    providerStatus: string | null;
    vendorUnits: number | null;
    vendorUnit: string | null;
    error: string | null;
    at: string;
  }>;
};

type JobView = {
  id: string;
  name: string | null;
  status: string;
  targets: Target[];
  totalRows: number;
  doneRows: number;
  budgetCredits: number;
  creditsUsed: number;
  creditsReserved: number;
  feePerRow: number;
  cancelRequested: boolean;
  createdAt: string;
  counts: Record<string, number>;
  providerUsage: Array<{ provider: string; name: string; calls: number; found: number; units: number; unknownUnits: number; unit: string | null }>;
  rows?: RowView[];
};

type JobListItem = { id: string; name: string | null; status: string; totalRows: number; doneRows: number; creditsUsed: number; createdAt: string };

const PRESETS: Array<{ id: string; label: string; hint: string; targets: Target[] }> = [
  { id: "owner_email", label: "Owner + work email", hint: "Recommended for outreach", targets: ["owner", "work_email"] },
  { id: "email", label: "Work email only", hint: "Uses the owner name in your file, or finds it first", targets: ["work_email"] },
  { id: "full", label: "Owner, email and business phone", hint: "Phone from public sources", targets: ["owner", "work_email", "phone"] },
  { id: "owner", label: "Owner name only", hint: "Decision-maker name and title", targets: ["owner"] },
];

const TARGET_LABEL: Record<Target, string> = {
  owner: "Owner",
  work_email: "Work email",
  phone: "Business phone",
  mobile: "Owner mobile",
};

const ROW_STATUS: Record<string, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300" },
  running: { label: "Running", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  waiting_provider: { label: "Waiting on provider", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  succeeded: { label: "Found", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  partial: { label: "Partly found", cls: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  not_found: { label: "Not found", cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400" },
  needs_input: { label: "Needs more input", cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  budget_exceeded: { label: "Budget reached", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  failed: { label: "Failed", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400" },
};

const EMAIL_STATUS: Record<string, string> = {
  valid: "Verified",
  catch_all: "Catch-all (review)",
  unknown: "Unconfirmed (review)",
};

const ATTEMPT_STATUS: Record<string, string> = {
  succeeded: "found",
  not_found: "no match",
  skipped: "skipped",
  error: "error",
  no_credit: "provider out of credit",
  unknown: "outcome unknown, not retried",
  pending: "waiting",
  rate_limited: "rate limited, retrying",
  submitting: "calling",
};

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function StatusPill({ status }: { status: string }) {
  const s = ROW_STATUS[status] ?? { label: status, cls: "bg-slate-100 text-slate-700" };
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

/**
 * Upload a CSV/XLSX, choose which fields to find, set a budget and run the provider
 * waterfall as a background job: progress, per-row results with their source, the
 * providers tried for each field, and a CSV export.
 */
export function EnrichmentJobsPanel() {
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [leads, setLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [presetId, setPresetId] = useState("owner_email");
  const [custom, setCustom] = useState<Target[] | null>(null);
  const [revealMobile, setRevealMobile] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [jobName, setJobName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<JobView | null>(null);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [rowFilter, setRowFilter] = useState<string>("all");
  const idemKey = useRef<string>(newKey());
  const fileInput = useRef<HTMLInputElement | null>(null);

  const targets: Target[] = custom ?? PRESETS.find((p) => p.id === presetId)!.targets;
  const fee = providers?.feePerRow ?? 0;
  const maxSpend = leads.length * fee;
  const budget = budgetInput.trim() === "" ? maxSpend : Math.max(0, Number(budgetInput) || 0);

  const loadJobs = useCallback(async () => {
    const r = await fetch("/api/enrichment/jobs").then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (r?.jobs) setJobs(r.jobs);
  }, []);

  useEffect(() => {
    fetch("/api/enrichment/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setProviders(j))
      .catch(() => null);
    fetch("/api/enrichment/jobs")
      .then((x) => (x.ok ? x.json() : null))
      .then((r) => r?.jobs && setJobs(r.jobs))
      .catch(() => null);
  }, []);

  const refreshJob = useCallback(async (id: string) => {
    const r = await fetch(`/api/enrichment/jobs/${id}?rows=1&limit=500`).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (r?.job) setJob(r.job);
    return r?.job as JobView | undefined;
  }, []);

  // Poll while the job is running.
  const jobId = job?.id;
  const jobActive = job ? job.status === "queued" || job.status === "running" : false;
  useEffect(() => {
    if (!jobId || !jobActive) return;
    const t = setInterval(() => {
      void refreshJob(jobId).then((j) => {
        if (j && j.status !== "queued" && j.status !== "running") void loadJobs();
      });
    }, 3000);
    return () => clearInterval(t);
  }, [jobId, jobActive, refreshJob, loadJobs]);

  async function handleFile(file: File) {
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const result =
        ext === "xlsx" || ext === "xls"
          ? await parseExcelBuffer(await file.arrayBuffer(), { allowMissingEmail: true })
          : parseSpreadsheetText(await file.text(), { allowMissingEmail: true });
      if (!result.leads.length) {
        setError("No rows with a business name were found in this file.");
        return;
      }
      setLeads(result.leads);
      setFileName(file.name);
      setJobName(file.name.replace(/\.[a-z0-9]+$/i, ""));
      setBudgetInput("");
      idemKey.current = newKey();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this file");
    }
  }

  function toggleTarget(t: Target) {
    const base = custom ?? targets;
    const next = base.includes(t) ? base.filter((x) => x !== t) : [...base, t];
    setCustom(next);
    if (t === "mobile" && base.includes("mobile")) setRevealMobile(false);
  }

  async function start() {
    if (!leads.length || !targets.length) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/enrichment/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idemKey.current },
        body: JSON.stringify({
          name: jobName || fileName,
          targets,
          revealMobile: targets.includes("mobile") && revealMobile,
          budgetCredits: budget,
          rows: leads.map((l) => ({
            businessName: l.businessName,
            website: l.website || null,
            ownerName: l.ownerName || null,
            ownerTitle: l.ownerTitle || null,
            email: l.email || null,
            phone: l.phone || null,
            city: l.city || null,
            state: l.state || null,
            country: l.country || null,
            linkedinUrl: l.linkedinUrl || null,
            leadId: l.leadId || null,
          })),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || j.error || "Could not start the job");
      await refreshJob(j.id);
      void loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the job");
    } finally {
      setStarting(false);
    }
  }

  async function cancel() {
    if (!job) return;
    await fetch(`/api/enrichment/jobs/${job.id}/cancel`, { method: "POST" }).catch(() => null);
    await refreshJob(job.id);
    void loadJobs();
  }

  function newJob() {
    setJob(null);
    setLeads([]);
    setFileName(null);
    setCustom(null);
    setRevealMobile(false);
    idemKey.current = newKey();
    if (fileInput.current) fileInput.current.value = "";
  }

  const visibleRows = useMemo(() => {
    const rows = job?.rows ?? [];
    if (rowFilter === "all") return rows;
    if (rowFilter === "review") return rows.filter((r) => r.result.emailForReview && !r.result.work_email);
    return rows.filter((r) => r.status === rowFilter);
  }, [job, rowFilter]);

  // ------------------------------------------------------------------ job view
  if (job) {
    const pct = job.totalRows ? Math.round((job.doneRows / job.totalRows) * 100) : 0;
    const active = job.status === "queued" || job.status === "running";
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{job.name || "Enrichment job"}</p>
            <p className="text-[12px] text-ink-muted">
              {job.targets.map((t) => TARGET_LABEL[t]).join(" · ")} · {job.totalRows} rows ·{" "}
              {job.status === "completed" ? "Finished" : job.status === "cancelled" ? "Cancelled" : job.cancelRequested ? "Stopping…" : "Running in the background; you can leave this page"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active && !job.cancelRequested ? (
              <Button size="sm" variant="secondary" onClick={() => void cancel()}>
                <HiOutlineStopCircle className="h-4 w-4" /> Stop
              </Button>
            ) : null}
            <a
              href={`/api/enrichment/jobs/${job.id}/export`}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-[color:var(--border-strong)] bg-[var(--surface)] px-3 text-xs font-semibold text-ink hover:border-brand-400"
            >
              <HiOutlineArrowDownTray className="h-4 w-4" /> Export CSV
            </a>
            <Button size="sm" variant="ghost" onClick={newJob}>
              New job
            </Button>
          </div>
        </div>

        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-muted">
            <span>
              {job.doneRows}/{job.totalRows} done ({pct}%)
            </span>
            <span>
              Credits used: <b className="text-ink">{job.creditsUsed}</b> of {job.budgetCredits} budget
              {job.creditsReserved > 0 ? ` (${job.creditsReserved} reserved)` : ""}
            </span>
            {Object.entries(job.counts).map(([k, v]) => (
              <span key={k}>
                {ROW_STATUS[k]?.label ?? k}: {v}
              </span>
            ))}
          </div>
        </div>

        {job.providerUsage.length ? (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[480px] text-left text-[12px]">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-ink-faint dark:bg-white/5">
                <tr>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Calls</th>
                  <th className="px-3 py-2">Found</th>
                  <th className="px-3 py-2">Vendor units</th>
                </tr>
              </thead>
              <tbody>
                {job.providerUsage.map((u) => (
                  <tr key={u.provider} className="border-t border-border/60">
                    <td className="px-3 py-1.5 font-medium text-ink">{u.name}</td>
                    <td className="px-3 py-1.5">{u.calls}</td>
                    <td className="px-3 py-1.5">{u.found}</td>
                    <td className="px-3 py-1.5">
                      {u.units} {u.unit ?? ""}
                      {u.unknownUnits ? <span className="text-ink-faint"> (+{u.unknownUnits} not reported)</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {["all", "succeeded", "partial", "review", "not_found", "needs_input", "budget_exceeded"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRowFilter(f)}
              className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ${
                rowFilter === f ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-muted hover:bg-slate-200 dark:bg-white/10"
              }`}
            >
              {f === "all" ? "All" : f === "review" ? "Email to review" : ROW_STATUS[f]?.label ?? f}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-ink-faint dark:bg-white/5">
              <tr>
                <th className="w-6 px-2 py-2" />
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Work email</th>
                {job.targets.includes("phone") ? <th className="px-3 py-2">Phone</th> : null}
                {job.targets.includes("mobile") ? <th className="px-3 py-2">Mobile</th> : null}
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Credits</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const open = openRow === r.id;
                const email = r.result.work_email;
                const review = r.result.emailForReview;
                return (
                  <Fragment key={r.id}>
                    <tr className="border-t border-border/60 align-top">
                      <td className="px-2 py-2">
                        <button type="button" aria-label="Show providers tried" onClick={() => setOpenRow(open ? null : r.id)} className="text-ink-faint hover:text-ink">
                          {open ? <HiOutlineChevronDown className="h-4 w-4" /> : <HiOutlineChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-ink">{r.input.businessName}</p>
                        {r.input.website ? <p className="text-[11px] text-ink-faint">{r.input.website}</p> : null}
                      </td>
                      <td className="px-3 py-2">
                        {r.result.owner ? (
                          <>
                            <p className="text-ink">{r.result.owner.value}</p>
                            <p className="text-[11px] text-ink-faint">
                              {r.result.ownerTitle ? `${r.result.ownerTitle} · ` : ""}
                              {r.result.owner.preExisting ? "from file" : r.result.owner.provider}
                            </p>
                          </>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {email ? (
                          <>
                            <p className="text-ink">{email.value}</p>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              {EMAIL_STATUS[email.status ?? ""] ?? email.status} · {email.preExisting ? "from file" : email.provider}
                            </p>
                          </>
                        ) : review ? (
                          <>
                            <p className="text-ink">{review.value}</p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                              {EMAIL_STATUS[review.status ?? ""] ?? review.status} · {review.provider}
                            </p>
                          </>
                        ) : (
                          <span className="text-ink-faint">{r.tracks.work_email?.reason ?? "—"}</span>
                        )}
                      </td>
                      {job.targets.includes("phone") ? (
                        <td className="px-3 py-2">
                          {r.result.phone ? (
                            <>
                              <p className="text-ink">{r.result.phone.value}</p>
                              <p className="text-[11px] text-ink-faint">{r.result.phone.preExisting ? "from file" : r.result.phone.provider}</p>
                            </>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                      ) : null}
                      {job.targets.includes("mobile") ? (
                        <td className="px-3 py-2">{r.result.mobile ? r.result.mobile.value : <span className="text-ink-faint">—</span>}</td>
                      ) : null}
                      <td className="px-3 py-2">
                        <StatusPill status={r.status} />
                        {r.lastError ? <p className="mt-1 text-[11px] text-rose-600">{r.lastError}</p> : null}
                      </td>
                      <td className="px-3 py-2">{r.charged || 0}</td>
                    </tr>
                    {open ? (
                      <tr className="bg-slate-50/60 dark:bg-white/[0.03]">
                        <td />
                        <td colSpan={7} className="px-3 py-2">
                          {r.attempts.length ? (
                            <ul className="space-y-1">
                              {r.attempts.map((a, i) => (
                                <li key={i} className="text-[12px] text-ink-muted">
                                  <b className="text-ink">{TARGET_LABEL[a.target]}</b> · {a.providerName}: {ATTEMPT_STATUS[a.status] ?? a.status}
                                  {a.providerStatus ? ` (${a.providerStatus})` : ""}
                                  {a.vendorUnits !== null ? ` · ${a.vendorUnits} ${a.vendorUnit ?? ""}` : ""}
                                  {a.error ? ` · ${a.error}` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[12px] text-ink-faint">No provider called yet.</p>
                          )}
                          {email?.evidence || r.result.owner?.evidence ? (
                            <p className="mt-1 text-[11px] text-ink-faint">Evidence: {email?.evidence || r.result.owner?.evidence}</p>
                          ) : null}
                          {email?.sourceUrl ? (
                            <a href={email.sourceUrl} target="_blank" rel="noreferrer nofollow" className="mt-1 block text-[11px] text-brand-600 hover:underline">
                              Source: {email.sourceUrl}
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ setup view
  const allTargets: Target[] = ["owner", "work_email", "phone", "mobile"];
  const providersFor = (t: Target) => providers?.targets.find((x) => x.id === t)?.providers ?? [];

  return (
    <div className="space-y-5">
      {!leads.length ? (
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-slate-50/50 px-6 py-10 text-center hover:border-brand-400 dark:bg-white/[0.03]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
        >
          <HiOutlineDocumentArrowUp className="h-8 w-8 text-brand-500" />
          <span className="text-sm font-semibold text-ink">Upload a CSV or Excel file</span>
          <span className="max-w-md text-[12px] text-ink-muted">
            Needs a business name column. A website and the owner&apos;s name give much better email results.
          </span>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2">
          <p className="text-[13px] text-ink">
            <b>{fileName}</b> · {leads.length} rows ·{" "}
            {leads.filter((l) => l.website).length} with website · {leads.filter((l) => l.ownerName).length} with owner name
          </p>
          <button type="button" onClick={newJob} className="text-ink-faint hover:text-ink" aria-label="Remove file">
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>
      )}

      <div>
        <p className="text-[12px] font-semibold text-ink">What should we find?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPresetId(p.id);
                setCustom(null);
                setRevealMobile(false);
              }}
              className={`rounded-xl border px-3 py-2 text-left ${
                !custom && presetId === p.id ? "border-brand-500 bg-brand-50/60 dark:bg-brand-500/10" : "border-border hover:border-brand-300"
              }`}
            >
              <p className="text-[13px] font-semibold text-ink">{p.label}</p>
              <p className="text-[11px] text-ink-muted">{p.hint}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {allTargets.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-[12px] text-ink">
              <input type="checkbox" checked={targets.includes(t)} onChange={() => toggleTarget(t)} />
              {TARGET_LABEL[t]}
              <span className="text-ink-faint">
                ({providersFor(t).length ? providersFor(t).map((p) => p.name).join(" → ") : "no provider connected"})
              </span>
            </label>
          ))}
        </div>
        {targets.includes("mobile") ? (
          <label className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <input type="checkbox" checked={revealMobile} onChange={(e) => setRevealMobile(e.target.checked)} className="mt-0.5" />
            Yes, look up owner mobile numbers. Mobile reveals cost the provider about 10 times an email lookup, so they only run when you tick this.
          </label>
        ) : null}
        <p className="mt-2 text-[11px] text-ink-muted">
          Each field stops at the first accepted result. An email is accepted only when it is on the company&apos;s domain and verified;
          catch-all or unconfirmed addresses are kept for your review and not charged.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-[12px] font-medium text-ink-muted">
          Job name
          <input className="saas-input mt-1" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. Austin roofers" />
        </label>
        <label className="block text-[12px] font-medium text-ink-muted">
          Budget cap (credits)
          <input
            className="saas-input mt-1"
            inputMode="decimal"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder={String(maxSpend)}
          />
        </label>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-ink-muted dark:bg-white/5">
          <p>
            {fee} credit{fee === 1 ? "" : "s"} per row that gains a requested field; nothing for rows with no new result.
          </p>
          <p className="mt-1">
            At most <b className="text-ink">{Math.min(budget, maxSpend)}</b> credits · balance {providers?.creditsRemaining ?? "…"}
          </p>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}

      <Button onClick={() => void start()} disabled={!leads.length || !targets.length} loading={starting}>
        Start enrichment ({leads.length} rows)
      </Button>

      {jobs.length ? (
        <div>
          <p className="text-[12px] font-semibold text-ink">Recent jobs</p>
          <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border/70">
            {jobs.map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => void refreshJob(j.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="font-medium text-ink">{j.name || "Enrichment job"}</span>
                  <span className="text-ink-muted">
                    {j.doneRows}/{j.totalRows} rows · {j.creditsUsed} credits · {j.status} · {new Date(j.createdAt).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
