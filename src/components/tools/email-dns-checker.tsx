"use client";

import { useState } from "react";

type Check = { status: "pass" | "warn" | "fail" | "unknown"; record: string | null; reason: string; instructions?: string; expected?: string };
type Report = {
  domain: string;
  provider: string;
  overallStatus: Check["status"];
  spf: Check;
  dkim: Check & { selector: string };
  dmarc: Check;
  mx: Check & { mailServers: string[] };
};

const STYLE: Record<Check["status"], { label: string; cls: string }> = {
  pass: { label: "Pass", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  warn: { label: "Warning", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  fail: { label: "Missing", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  unknown: { label: "Could not check", cls: "bg-slate-50 text-slate-600 ring-slate-200" },
};

/** Free SPF / DKIM / DMARC / MX checker (server does DNS lookups; nothing is stored). */
export function EmailDnsChecker() {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setReport(null);
    const res = await fetch("/api/tools/email-dns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setError(j.error || "The check failed. Try again in a minute.");
      return;
    }
    setReport(j.report);
  }

  const rows: Array<[string, Check | undefined, string]> = report
    ? [
        ["SPF", report.spf, "Says which servers may send email for the domain."],
        ["DKIM", report.dkim, `Signs each email so it can't be altered${report.dkim.selector ? ` (selector "${report.dkim.selector}")` : ""}.`],
        ["DMARC", report.dmarc, "Tells inboxes what to do when SPF or DKIM fail."],
        ["MX", report.mx, report.mx.mailServers.length ? `Mail servers: ${report.mx.mailServers.slice(0, 3).join(", ")}` : "Where the domain receives email."],
      ]
    : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="dns-domain" className="sr-only">
          Domain or email address
        </label>
        <input
          id="dns-domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourcompany.com or you@yourcompany.com"
          className="h-11 flex-1 rounded-xl border border-slate-300 px-4 text-[15px] text-slate-900 focus:border-fuchsia-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check domain"}
        </button>
      </form>
      {error ? <p className="mt-3 text-[14px] text-rose-700">{error}</p> : null}
      {report ? (
        <div className="mt-5 space-y-3" aria-live="polite">
          <p className="text-[14px] text-slate-600">
            Results for <b className="text-slate-900">{report.domain}</b>
            {report.provider !== "custom" ? ` (email host looks like ${report.provider})` : ""}:
          </p>
          {rows.map(([name, c, help]) =>
            c ? (
              <div key={name} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-bold text-slate-900">{name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ring-1 ${STYLE[c.status].cls}`}>{STYLE[c.status].label}</span>
                </div>
                <p className="mt-1 text-[13px] text-slate-500">{help}</p>
                <p className="mt-2 text-[14px] text-slate-700">{c.reason}</p>
                {c.record ? <p className="mt-1 break-all font-mono text-[12px] text-slate-500">{c.record}</p> : null}
                {c.instructions ? <p className="mt-2 text-[13.5px] text-slate-700"><b>Fix:</b> {c.instructions}</p> : null}
                {c.expected ? <p className="mt-1 break-all font-mono text-[12px] text-slate-600">Suggested: {c.expected}</p> : null}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
