"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

type Visitor = {
  id: string;
  visitorKey: string;
  email: string | null;
  emailOptIn: boolean;
  source: string | null;
  landingPath: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  visitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  convertedUserId: string | null;
  convertedAt: string | null;
};

type Stats = {
  withEmail: number;
  optedIn: number;
  converted: number;
  anonymous: number;
};

export default function AdminSiteLeadsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [emailsOnly, setEmailsOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/marketing-visitors?emailsOnly=${emailsOnly ? "1" : "0"}&limit=200`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load site leads");
        setVisitors([]);
        setStats(null);
        return;
      }
      setVisitors(data.visitors ?? []);
      setStats(data.stats ?? null);
      setTotal(data.total ?? 0);
    } catch {
      setError("Network error loading site leads");
    } finally {
      setLoading(false);
    }
  }, [emailsOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadCsv() {
    setExportBusy(true);
    try {
      const res = await fetch("/api/admin/marketing-visitors/export?format=csv");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed — capture emails via homepage modals first");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "site-marketing-leads.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Site leads"
        description="Homepage visitors tracked via cookie cl_mkt_vid. Emails come from trial/exit modals and signup."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Button
              variant="secondary"
              loading={exportBusy}
              disabled={exportBusy}
              onClick={() => void downloadCsv()}
            >
              Export emails CSV
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          ["With email", stats?.withEmail],
          ["Opted in", stats?.optedIn],
          ["Converted", stats?.converted],
          ["Anonymous visits", stats?.anonymous],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-border/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {loading ? "—" : (value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px]">
        <label className="inline-flex items-center gap-2 text-ink-muted">
          <input
            type="checkbox"
            checked={emailsOnly}
            onChange={(e) => setEmailsOnly(e.target.checked)}
            className="rounded border-border"
          />
          Emails only
        </label>
        <span className="text-ink-faint">{total} shown</span>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-border/70 bg-slate-50/80 text-[11px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Source</th>
                <th className="px-3 py-3 font-semibold">UTM</th>
                <th className="px-3 py-3 font-semibold">Visits</th>
                <th className="px-3 py-3 font-semibold">Last seen</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {visitors.map((v) => (
                <tr key={v.id} className="hover:bg-brand-50/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{v.email ?? "—"}</p>
                    <p className="text-[11px] text-ink-faint">
                      {v.landingPath ?? "/"} · cookie {v.visitorKey}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-ink-muted">{v.source ?? "—"}</td>
                  <td className="px-3 py-3 text-ink-muted">
                    {[v.utmSource, v.utmMedium, v.utmCampaign].filter(Boolean).join(" / ") ||
                      "—"}
                  </td>
                  <td className="px-3 py-3 text-ink">{v.visitCount}</td>
                  <td className="px-3 py-3 text-ink-muted">
                    {new Date(v.lastSeenAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    {v.convertedUserId ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Converted
                      </span>
                    ) : v.emailOptIn && v.email ? (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                        Opted in
                      </span>
                    ) : v.email ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Email
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        Visit only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && visitors.length === 0 && !error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                    No site leads yet. Open the homepage to create a visit cookie, or submit an
                    email in the trial modal.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                    Loading…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
        Data lives in Postgres table <code className="text-ink-muted">MarketingVisitor</code>.
        Cookie <code className="text-ink-muted">cl_mkt_vid</code> is set on homepage load. Also
        export from{" "}
        <a href="/admin/customers" className="font-medium text-brand-700 hover:underline">
          Customers → Site leads CSV
        </a>
        .
      </p>
    </div>
  );
}
