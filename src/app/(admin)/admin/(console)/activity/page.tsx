"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
import { ActivityFeed, PeriodSelect } from "@/components/admin/activity-feed";
import { cn } from "@/lib/utils";

type Stats = {
  emailsSent: number;
  emailsFailed: number;
  campaignEmails: number;
  directEmails: number;
  opens: number;
  replies: number;
  smsSent: number;
  smsFailed: number;
  smsReceived: number;
  searches: number;
  leadsFound: number;
  exports: number;
  leadsExported: number;
  creditsUsed: number;
  signIns: number;
};

type Row = {
  user: {
    id: string;
    email: string;
    name: string | null;
    companyName: string | null;
    plan: string;
    isActive: boolean;
  };
  stats: Stats;
  lastActiveAt: string | null;
};

type Leaderboard = {
  totals: Stats;
  totalUsers: number;
  activeUsers: number;
  total: number;
  page: number;
  pageSize: number;
  rows: Row[];
};

const COLUMNS: Array<{ key: keyof Stats | "lastActive"; label: string; hint?: string }> = [
  { key: "emailsSent", label: "Emails sent" },
  { key: "emailsFailed", label: "Failed" },
  { key: "opens", label: "Opens" },
  { key: "replies", label: "Replies" },
  { key: "smsSent", label: "SMS sent" },
  { key: "searches", label: "Searches" },
  { key: "leadsFound", label: "Leads found" },
  { key: "exports", label: "Exports" },
  { key: "creditsUsed", label: "Credits used" },
  { key: "signIns", label: "Sign-ins" },
  { key: "lastActive", label: "Last active" },
];

const fmt = (n: number) => n.toLocaleString();
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

function relative(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminActivityPage() {
  const [tab, setTab] = useState<"users" | "feed">("users");
  const [period, setPeriod] = useState("all");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("emailsSent");
  const [onlyActive, setOnlyActive] = useState(true);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data: Leaderboard | null; error: string }>({
    key: "",
    data: null,
    error: "",
  });

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const key = new URLSearchParams({
    period,
    q: query,
    sort,
    onlyActive: String(onlyActive),
    page: String(page),
  }).toString();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/user-activity?${key}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) setResult({ key, data: null, error: d.error || "Could not load activity." });
        else setResult({ key, data: d as Leaderboard, error: "" });
      })
      .catch(() => !cancelled && setResult({ key, data: null, error: "Could not load activity." }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loading = result.key !== key;
  const data = result.data;
  const t = data?.totals;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <AdminPageHeader
        title="Activity monitor"
        description="See what every user does: emails sent and failed, replies, SMS, lead searches, exports, credits and sign-ins. Open any user for their full history."
        actions={
          <PeriodSelect
            value={period}
            onChange={(v) => {
              setPeriod(v);
              setPage(1);
            }}
          />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AdminStatCard compact label="Emails sent" value={t ? fmt(t.emailsSent) : "–"} hint={t ? `${fmt(t.campaignEmails)} campaign · ${fmt(t.directEmails)} direct` : undefined} />
        <AdminStatCard compact label="Failed emails" value={t ? fmt(t.emailsFailed) : "–"} />
        <AdminStatCard compact label="Replies" value={t ? fmt(t.replies) : "–"} hint={t ? plural(t.opens, "open") : undefined} />
        <AdminStatCard compact label="SMS sent" value={t ? fmt(t.smsSent) : "–"} hint={t && t.smsFailed ? `${fmt(t.smsFailed)} failed` : undefined} />
        <AdminStatCard compact label="Lead searches" value={t ? fmt(t.searches) : "–"} hint={t ? `${plural(t.leadsFound, "lead")} found` : undefined} />
        <AdminStatCard compact label="Active users" value={data ? fmt(data.activeUsers) : "–"} hint={data ? `of ${plural(data.totalUsers, "user")}` : undefined} />
      </div>

      <div className="mb-4 flex gap-1.5">
        {[
          { id: "users" as const, label: "By user" },
          { id: "feed" as const, label: "All activity" },
        ].map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              tab === x.id
                ? "bg-ink text-[var(--surface)]"
                : "border border-border text-ink-muted hover:bg-brand-50 hover:text-ink",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "feed" ? (
        <ActivityFeed period={period} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
            <div className="relative min-w-[14rem] flex-1">
              <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by email, name or company"
                className="saas-input h-10 w-full pl-9 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => {
                  setOnlyActive(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 accent-brand-600"
              />
              Only users with activity in this period
            </label>
          </div>

          {result.error ? (
            <p className="px-4 py-8 text-sm text-rose-600">{result.error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2.5 font-semibold">User</th>
                    {COLUMNS.map((c) => (
                      <th key={c.key} className="px-3 py-2.5 text-right font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setSort(c.key);
                            setPage(1);
                          }}
                          className={cn("uppercase tracking-wide hover:text-ink", sort === c.key && "text-brand-600")}
                          title={`Sort by ${c.label.toLowerCase()}`}
                        >
                          {c.label}
                          {sort === c.key ? " ↓" : ""}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(loading ? [] : (data?.rows ?? [])).map((r) => (
                    <tr key={r.user.id} className="hover:bg-[var(--input-bg)]">
                      <td className="max-w-[16rem] px-4 py-2.5">
                        <Link href={`/admin/activity/${r.user.id}`} className="block min-w-0">
                          <span className="block truncate font-semibold text-ink hover:text-brand-600">
                            {r.user.companyName || r.user.name || r.user.email}
                          </span>
                          <span className="block truncate text-[11.5px] text-ink-muted">
                            {r.user.email} · {r.user.plan}
                            {r.user.isActive ? "" : " · suspended"}
                          </span>
                        </Link>
                      </td>
                      {COLUMNS.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "whitespace-nowrap px-3 py-2.5 text-right tabular-nums",
                            c.key === "emailsFailed" && r.stats.emailsFailed > 0 ? "font-semibold text-rose-600" : "text-ink",
                            c.key === "lastActive" && "text-ink-muted",
                          )}
                        >
                          {c.key === "lastActive" ? relative(r.lastActiveAt) : fmt(r.stats[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {loading ? (
                    <tr>
                      <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-ink-muted">
                        Loading users…
                      </td>
                    </tr>
                  ) : null}
                  {!loading && data && data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-ink-muted">
                        {onlyActive ? "No user activity in this period." : "No users match your search."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > 0 ? (
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-[12px] text-ink-faint">
              <span>
                {fmt(data.total)} user{data.total === 1 ? "" : "s"} · page {data.page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border px-3 py-1 font-semibold text-ink disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border px-3 py-1 font-semibold text-ink disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
