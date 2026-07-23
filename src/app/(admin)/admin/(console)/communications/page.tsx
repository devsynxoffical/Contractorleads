"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";

type Payload = {
  summary: {
    emails: number;
    smtpAccounts: number;
    sequences: number;
    enrollmentsActive: number;
  };
  emails: Array<{
    id: string;
    direction: string;
    status: string;
    subject: string | null;
    fromEmail: string | null;
    toEmail: string | null;
    createdAt: string;
    error: string | null;
    user: { id: string; email: string; companyName: string | null; name: string | null };
    lead: { id: string; businessName: string } | null;
  }>;
  smtpAccounts: Array<{
    id: string;
    label: string | null;
    host: string;
    fromEmail: string;
    isDefault: boolean;
    updatedAt: string;
    user: { id: string; email: string; companyName: string | null; name: string | null };
  }>;
  sequences: Array<{
    id: string;
    name: string;
    enabled: boolean;
    updatedAt: string;
    user: { id: string; email: string; companyName: string | null; name: string | null };
    _count: { enrollments: number };
  }>;
};

export default function AdminCommunicationsPage() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    fetch("/api/admin/communications")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Email & Outreach"
        description="Platform-wide SMTP mailboxes, nurture sequences, and lead email traffic (outbound + inbound replies)."
        actions={
          <Link
            href="/admin/email-preview"
            className="rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-semibold text-ink"
          >
            Transactional templates →
          </Link>
        }
      />

      {!data ? (
        <p className="text-sm text-ink-muted animate-pulse">Loading…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Lead emails" value={data.summary.emails} />
            <AdminStatCard label="SMTP accounts" value={data.summary.smtpAccounts} />
            <AdminStatCard label="Sequences" value={data.summary.sequences} />
            <AdminStatCard
              label="Active enrollments"
              value={data.summary.enrollmentsActive}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <HudPanel title="Recent lead emails" subtitle="One-off sends and inbound replies">
              <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                {data.emails.length === 0 && (
                  <li className="text-sm text-ink-muted">No lead emails yet.</li>
                )}
                {data.emails.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg border border-brand-500/10 px-3 py-2 text-[12px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wide text-brand-500">
                        {e.direction} · {e.status}
                      </span>
                      <span className="text-ink-faint">
                        {new Date(e.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-ink">{e.subject || "(no subject)"}</p>
                    <p className="mt-0.5 text-ink-muted">
                      {e.fromEmail} → {e.toEmail}
                      {e.lead ? ` · ${e.lead.businessName}` : ""}
                    </p>
                    <Link
                      href={`/admin/customers/${e.user.id}`}
                      className="mt-1 inline-block text-brand-500 hover:underline"
                    >
                      {e.user.companyName || e.user.name || e.user.email}
                    </Link>
                    {e.error ? (
                      <p className="mt-1 text-red-400">{e.error}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </HudPanel>

            <div className="space-y-5">
              <HudPanel title="SMTP mailboxes" subtitle="Customer-connected senders">
                <ul className="max-h-[200px] space-y-2 overflow-y-auto text-[12px]">
                  {data.smtpAccounts.length === 0 && (
                    <li className="text-ink-muted">No SMTP accounts configured.</li>
                  )}
                  {data.smtpAccounts.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-2"
                    >
                      <div>
                        <p className="font-medium text-ink">
                          {a.label || a.fromEmail}
                          {a.isDefault ? " · default" : ""}
                        </p>
                        <p className="text-ink-muted">
                          {a.host} · {a.fromEmail}
                        </p>
                        <Link
                          href={`/admin/customers/${a.user.id}`}
                          className="text-brand-500 hover:underline"
                        >
                          {a.user.companyName || a.user.email}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </HudPanel>

              <HudPanel title="Nurture sequences" subtitle="Day 1/2/3 automation">
                <ul className="max-h-[200px] space-y-2 overflow-y-auto text-[12px]">
                  {data.sequences.length === 0 && (
                    <li className="text-ink-muted">No sequences yet.</li>
                  )}
                  {data.sequences.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-2"
                    >
                      <div>
                        <p className="font-medium text-ink">
                          {s.name}{" "}
                          <span
                            className={
                              s.enabled ? "text-emerald-400" : "text-ink-faint"
                            }
                          >
                            {s.enabled ? "on" : "off"}
                          </span>
                        </p>
                        <p className="text-ink-muted">
                          {s._count.enrollments} enrollments
                        </p>
                        <Link
                          href={`/admin/customers/${s.user.id}`}
                          className="text-brand-500 hover:underline"
                        >
                          {s.user.companyName || s.user.email}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </HudPanel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
