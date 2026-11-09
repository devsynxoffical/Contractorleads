"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
import { ActivityFeed, PeriodSelect } from "@/components/admin/activity-feed";
import { LoginAsButton } from "@/components/admin/login-as-button";

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

type Detail = {
  user: {
    id: string;
    email: string;
    name: string | null;
    companyName: string | null;
    plan: string;
    subscriptionStatus: string;
    isActive: boolean;
    creditsRemaining: number;
    messagingAddonStatus: string;
    createdAt: string;
    lastLoginAt: string | null;
    firstActivityAt: string | null;
    _count: { campaigns: number; smtpAccounts: number; savedLeads: number };
  };
  stats: Stats;
  series: Array<{ date: string; sent: number; failed: number }>;
};

const fmt = (n: number) => n.toLocaleString();
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

/** Emails sent per day: one series, so the title names it and no legend is needed. */
function EmailsPerDayChart({ series }: { series: Detail["series"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((d) => d.sent));
  const total = series.reduce((a, d) => a + d.sent, 0);
  const active = hover !== null ? series[hover] : null;
  const label = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div className="rounded-2xl border border-border/80 bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-ink">
          Emails sent per day{series.length >= 90 ? " (last 90 days)" : ""}
        </h2>
        <p className="text-[12px] tabular-nums text-ink-muted" aria-live="polite">
          {active
            ? `${label(active.date)}: ${fmt(active.sent)} sent${active.failed ? ` · ${fmt(active.failed)} failed` : ""}`
            : `${fmt(total)} sent in ${series.length} day${series.length === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="relative mt-5 h-36" onMouseLeave={() => setHover(null)}>
        {/* recessive gridline at the max */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border/70" />
        <span className="pointer-events-none absolute left-0 top-0 -translate-y-full pb-0.5 text-[10.5px] tabular-nums text-ink-faint">
          {fmt(max)}
        </span>
        <div className="flex h-full items-end gap-[2px] border-b border-border">
          {series.map((d, i) => (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${label(d.date)}: ${d.sent} sent, ${d.failed} failed`}
              className="group flex h-full min-w-0 flex-1 items-end"
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${
                  hover === i ? "bg-brand-700" : "bg-brand-500"
                }`}
                style={{ height: d.sent ? `${Math.max(3, (d.sent / max) * 100)}%` : "0%" }}
              />
            </button>
          ))}
        </div>
      </div>
      {series.length > 1 ? (
        <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-faint">
          <span>{label(series[0].date)}</span>
          <span>{label(series[series.length - 1].date)}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminUserActivityPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [period, setPeriod] = useState("all");
  const [result, setResult] = useState<{ key: string; data: Detail | null; error: string }>({
    key: "",
    data: null,
    error: "",
  });
  const key = `${userId}|${period}`;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/user-activity/users/${encodeURIComponent(userId)}?period=${period}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) setResult({ key, data: null, error: d.error || "Could not load this user." });
        else setResult({ key, data: d as Detail, error: "" });
      })
      .catch(() => !cancelled && setResult({ key, data: null, error: "Could not load this user." }));
    return () => {
      cancelled = true;
    };
  }, [key, userId, period]);

  const data = result.key === key ? result.data : null;
  const u = data?.user;
  const s = data?.stats;
  const failRate = s && s.emailsSent + s.emailsFailed > 0
    ? Math.round((s.emailsFailed / (s.emailsSent + s.emailsFailed)) * 100)
    : null;

  return (
    <div>
      <Link
        href="/admin/activity"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        All users
      </Link>

      {result.error ? (
        <p className="rounded-2xl border border-border bg-[var(--surface)] px-4 py-8 text-sm text-rose-600">{result.error}</p>
      ) : (
        <>
          <AdminPageHeader
            title={u ? u.companyName || u.name || u.email : "Loading…"}
            description={
              u
                ? `${u.email} · ${u.plan} plan (${u.subscriptionStatus})${u.isActive ? "" : " · suspended"} · joined ${new Date(u.createdAt).toLocaleDateString()}${u.firstActivityAt ? ` · first activity ${new Date(u.firstActivityAt).toLocaleDateString()}` : ""}${u.lastLoginAt ? ` · last sign-in ${new Date(u.lastLoginAt).toLocaleString()}` : ""}`
                : undefined
            }
            actions={
              <>
                <PeriodSelect value={period} onChange={setPeriod} />
                {u ? (
                  <Link
                    href={`/admin/customers/${u.id}`}
                    className="inline-flex h-10 items-center rounded-xl border border-border bg-[var(--surface)] px-4 text-sm font-semibold text-ink"
                  >
                    Customer profile
                  </Link>
                ) : null}
                {u ? <LoginAsButton userId={u.id} disabled={!u.isActive} className="h-10 rounded-xl px-4 text-sm" /> : null}
              </>
            }
          />

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <AdminStatCard compact label="Emails sent" value={s ? fmt(s.emailsSent) : "–"} hint={s ? `${fmt(s.campaignEmails)} campaign · ${fmt(s.directEmails)} direct` : undefined} />
            <AdminStatCard compact label="Failed emails" value={s ? fmt(s.emailsFailed) : "–"} hint={failRate !== null ? `${failRate}% of attempts` : undefined} />
            <AdminStatCard compact label="Opens / replies" value={s ? `${fmt(s.opens)} / ${fmt(s.replies)}` : "–"} />
            <AdminStatCard compact label="SMS" value={s ? fmt(s.smsSent) : "–"} hint={s ? `${fmt(s.smsFailed)} failed · ${fmt(s.smsReceived)} received` : undefined} />
            <AdminStatCard compact label="Lead searches" value={s ? fmt(s.searches) : "–"} hint={s ? `${plural(s.leadsFound, "lead")} found` : undefined} />
            <AdminStatCard compact label="Exports" value={s ? fmt(s.exports) : "–"} hint={s ? `${plural(s.leadsExported, "lead")} exported` : undefined} />
            <AdminStatCard compact label="Credits used" value={s ? fmt(s.creditsUsed) : "–"} hint={u ? `${fmt(Math.round(u.creditsRemaining * 100) / 100)} left` : undefined} />
            <AdminStatCard compact label="Sign-ins" value={s ? fmt(s.signIns) : "–"} />
            <AdminStatCard compact label="Campaigns" value={u ? fmt(u._count.campaigns) : "–"} hint="all time" />
            <AdminStatCard compact label="Own mailboxes" value={u ? fmt(u._count.smtpAccounts) : "–"} hint="connected SMTP" />
            <AdminStatCard compact label="Saved leads" value={u ? fmt(u._count.savedLeads) : "–"} hint="all time" />
            <AdminStatCard compact label="Messaging add-on" value={u ? u.messagingAddonStatus : "–"} />
          </div>

          {data ? (
            <div className="mb-5">
              <EmailsPerDayChart series={data.series} />
            </div>
          ) : null}

          <h2 className="mb-3 text-[15px] font-semibold text-ink">Activity history</h2>
          <ActivityFeed userId={userId} period={period} />
        </>
      )}
    </div>
  );
}
