"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailDashboardStats } from "@/lib/email-dashboard";

type EmailRow = {
  id: string;
  direction: string;
  status: string;
  subject: string | null;
  fromEmail: string | null;
  toEmail: string | null;
  createdAt: string;
  error: string | null;
  lead?: { id: string; businessName: string } | null;
  user?: {
    id: string;
    email: string;
    companyName: string | null;
    name: string | null;
  };
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-[var(--surface)] px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[12px] leading-snug text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function WeekChart({ days }: { days: EmailDashboardStats["last7Days"] }) {
  const max = useMemo(
    () =>
      Math.max(
        1,
        ...days.map((d) => Math.max(d.sent, d.failed, d.received)),
      ),
    [days],
  );

  return (
    <div className="space-y-3">
      <div className="flex h-[140px] items-end gap-2">
        {days.map((d) => (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex h-[120px] w-full items-end justify-center gap-0.5">
              <div
                className="w-[28%] rounded-t-sm bg-emerald-400/90"
                style={{ height: `${Math.max(3, (d.sent / max) * 100)}%` }}
                title={`${d.sent} sent`}
              />
              <div
                className="w-[28%] rounded-t-sm bg-sky-400/90"
                style={{
                  height: `${Math.max(3, (d.received / max) * 100)}%`,
                }}
                title={`${d.received} received`}
              />
              <div
                className="w-[28%] rounded-t-sm bg-rose-400/85"
                style={{ height: `${Math.max(3, (d.failed / max) * 100)}%` }}
                title={`${d.failed} failed`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-ink-faint">
              {d.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Sent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sky-400" /> Received
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-rose-400" /> Failed
        </span>
      </div>
    </div>
  );
}

function statusLabel(direction: string, status: string) {
  if (direction === "inbound") return "Received";
  if (status === "sent") return "Delivered";
  if (status === "failed") return "Failed";
  return status;
}

export function EmailMetricsDashboard({
  endpoint,
  showAgency = false,
  leadHref,
}: {
  endpoint: string;
  showAgency?: boolean;
  leadHref?: (leadId: string) => string;
}) {
  const [stats, setStats] = useState<EmailDashboardStats | null>(null);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(endpoint)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load");
        setStats(json.stats);
        setEmails(json.emails ?? []);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load email stats"),
      );
  }, [endpoint]);

  if (error) {
    return (
      <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="animate-pulse text-sm text-ink-muted">
        Loading email dashboard…
      </p>
    );
  }

  const deliveryRate =
    stats.sent + stats.failed > 0
      ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Delivered"
          value={stats.sent.toLocaleString()}
          hint={`${stats.sentToday} today · SMTP accepted`}
        />
        <Stat
          label="Received"
          value={stats.received.toLocaleString()}
          hint={`${stats.receivedToday} today · ${stats.unreadReceived} unread`}
        />
        <Stat
          label="Failed"
          value={stats.failed.toLocaleString()}
          hint={`${stats.failedToday} today · send errors`}
        />
        <Stat
          label="Delivery rate"
          value={`${deliveryRate}%`}
          hint={`${stats.total.toLocaleString()} total messages`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="SMTP mailboxes" value={stats.smtpAccounts} />
        <Stat label="Sequences on" value={stats.sequencesEnabled} />
        <Stat label="Active enrollments" value={stats.enrollmentsActive} />
        <Stat
          label="Paused / done"
          value={`${stats.enrollmentsPaused} / ${stats.enrollmentsCompleted}`}
        />
      </div>

      <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5">
        <p className="text-[13px] font-semibold text-ink">Last 7 days</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          Sent, received replies, and failed sends
        </p>
        <div className="mt-4">
          <WeekChart days={stats.last7Days} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-[var(--surface)] p-4 sm:p-5">
        <p className="text-[13px] font-semibold text-ink">Recent activity</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          One-off outreach and inbound replies
        </p>
        {!emails.length ? (
          <p className="mt-4 text-sm text-ink-faint">No emails yet.</p>
        ) : (
          <ul className="mt-3 max-h-[420px] divide-y divide-border overflow-y-auto">
            {emails.map((e) => (
              <li key={e.id} className="py-3 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                    {statusLabel(e.direction, e.status)}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-ink">
                  {e.subject || "(no subject)"}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {e.fromEmail} → {e.toEmail}
                  {e.lead ? ` · ${e.lead.businessName}` : ""}
                </p>
                {showAgency && e.user ? (
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {e.user.companyName || e.user.name || e.user.email}
                  </p>
                ) : null}
                {e.lead && leadHref ? (
                  <a
                    href={leadHref(e.lead.id)}
                    className="mt-1 inline-block text-[12px] font-semibold text-brand-600 hover:underline"
                  >
                    Open lead →
                  </a>
                ) : null}
                {e.error ? (
                  <p className="mt-1 text-[12px] text-rose-600">{e.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
