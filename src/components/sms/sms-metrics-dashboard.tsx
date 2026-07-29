"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SmsDashboardStats } from "@/lib/sms-dashboard";

type SmsRow = {
  id: string;
  direction: string;
  status: string;
  body: string;
  fromPhone: string;
  toPhone: string;
  createdAt: string;
  error: string | null;
  twilioSid: string | null;
  lead?: { id: string; businessName: string; phone: string | null } | null;
  user?: {
    id: string;
    email: string;
    companyName: string | null;
    name: string | null;
  };
};

type TopAgency = {
  userId: string;
  count: number;
  email: string;
  companyName: string | null;
  name: string | null;
  messagingAddonStatus: string;
  messagingAddonManual: boolean;
};

type TwilioInfo = {
  liveReady: boolean;
  fromNumber: string;
  messagingServiceSid: string;
  webhookUrl: string;
  source: string;
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

function WeekChart({ days }: { days: SmsDashboardStats["last7Days"] }) {
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
  if (status === "failed") return "Failed";
  if (status === "sent" || status === "queued" || status === "delivered") {
    return "Sent";
  }
  return status;
}

export function SmsMetricsDashboard({
  endpoint = "/api/admin/sms",
  leadHref,
}: {
  endpoint?: string;
  leadHref?: (leadId: string) => string;
}) {
  const [stats, setStats] = useState<SmsDashboardStats | null>(null);
  const [messages, setMessages] = useState<SmsRow[]>([]);
  const [topAgencies, setTopAgencies] = useState<TopAgency[]>([]);
  const [twilio, setTwilio] = useState<TwilioInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(endpoint)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load");
        setStats(json.stats);
        setMessages(json.messages ?? []);
        setTopAgencies(json.topAgencies ?? []);
        setTwilio(json.twilio ?? null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load SMS stats"),
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
        Loading SMS dashboard…
      </p>
    );
  }

  const deliveryRate =
    stats.sent + stats.failed > 0
      ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {twilio ? (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] ${
            twilio.liveReady
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300"
          }`}
        >
          {twilio.liveReady ? (
            <>
              Twilio live · From{" "}
              <span className="font-mono">
                {twilio.fromNumber || twilio.messagingServiceSid || "—"}
              </span>{" "}
              · source {twilio.source}
            </>
          ) : (
            <>
              Twilio not configured — set credentials in{" "}
              <Link href="/admin/system" className="font-semibold underline">
                System &amp; API Keys
              </Link>
              .
            </>
          )}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Sent"
          value={stats.sent.toLocaleString()}
          hint={`${stats.sentToday} today · Twilio accepted`}
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
          hint={`${stats.uniqueLeadsTexted} leads · ${stats.agenciesWithSms} agencies`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Messaging add-on"
          value={stats.messagingAddonActive.toLocaleString()}
          hint="Active or comped agencies"
        />
        <Stat
          label="Agencies texting"
          value={stats.agenciesWithSms.toLocaleString()}
          hint="At least one SMS logged"
        />
        <Stat
          label="Leads texted"
          value={stats.uniqueLeadsTexted.toLocaleString()}
          hint="Unique lead phones contacted"
        />
      </div>

      <div className="rounded-xl border border-border bg-[var(--surface)] p-4">
        <p className="mb-3 text-[13px] font-semibold text-ink">Last 7 days</p>
        <WeekChart days={stats.last7Days} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">Recent SMS</p>
          </div>
          {!messages.length ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              No SMS messages yet.
            </p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {messages.map((m) => (
                <li key={m.id} className="px-4 py-3 text-[13px]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-ink">
                      {m.lead ? (
                        leadHref ? (
                          <Link
                            href={leadHref(m.lead.id)}
                            className="hover:underline"
                          >
                            {m.lead.businessName}
                          </Link>
                        ) : (
                          m.lead.businessName
                        )
                      ) : (
                        "Unknown lead"
                      )}{" "}
                      <span
                        className={
                          m.status === "failed"
                            ? "text-rose-600"
                            : m.direction === "inbound"
                              ? "text-sky-600"
                              : "text-emerald-600"
                        }
                      >
                        · {statusLabel(m.direction, m.status)}
                      </span>
                    </p>
                    <span className="text-[12px] text-ink-muted">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-ink-muted">{m.body}</p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {m.fromPhone} → {m.toPhone}
                    {m.user ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/customers/${m.user.id}`}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          {m.user.companyName || m.user.email}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  {m.error ? (
                    <p className="mt-1 text-[12px] text-rose-600">{m.error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-[var(--surface)]">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">
              Top agencies by SMS volume
            </p>
          </div>
          {!topAgencies.length ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              No agency SMS activity yet.
            </p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {topAgencies.map((a) => (
                <li
                  key={a.userId}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/customers/${a.userId}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {a.companyName || a.name || a.email}
                    </Link>
                    <p className="truncate text-[12px] text-ink-faint">
                      {a.email}
                      {a.messagingAddonManual
                        ? " · add-on comped"
                        : a.messagingAddonStatus === "active" ||
                            a.messagingAddonStatus === "trialing"
                          ? " · add-on on"
                          : " · add-on off"}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums font-semibold text-ink">
                    {a.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
