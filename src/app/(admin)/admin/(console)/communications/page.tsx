"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";
import { EmailMetricsDashboard } from "@/components/email/email-metrics-dashboard";

type SidePayload = {
  smtpAccounts: Array<{
    id: string;
    label: string | null;
    host: string;
    fromEmail: string;
    isDefault: boolean;
    enabled: boolean;
    user: { id: string; email: string; companyName: string | null; name: string | null };
  }>;
  sequences: Array<{
    id: string;
    name: string;
    enabled: boolean;
    user: { id: string; email: string; companyName: string | null; name: string | null };
    _count: { enrollments: number };
  }>;
};

export default function AdminCommunicationsPage() {
  const [side, setSide] = useState<SidePayload | null>(null);

  useEffect(() => {
    fetch("/api/admin/communications")
      .then((r) => r.json())
      .then((d) =>
        setSide({
          smtpAccounts: d.smtpAccounts ?? [],
          sequences: d.sequences ?? [],
        }),
      )
      .catch(() => setSide({ smtpAccounts: [], sequences: [] }));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email dashboard"
        description="Delivered sends, inbound replies, failures, nurture enrollments, and mailbox activity across all agencies."
        actions={
          <Link
            href="/admin/email-preview"
            className="rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold text-ink"
          >
            Transactional templates →
          </Link>
        }
      />

      <EmailMetricsDashboard
        endpoint="/api/admin/communications"
        showAgency
        leadHref={(id) => `/admin/leads/${id}`}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <HudPanel title="SMTP mailboxes" subtitle="Customer-connected senders">
          {!side ? (
            <p className="animate-pulse text-sm text-ink-muted">Loading…</p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto text-[13px]">
              {side.smtpAccounts.length === 0 ? (
                <li className="text-ink-muted">No SMTP accounts configured.</li>
              ) : (
                side.smtpAccounts.map((a) => (
                  <li
                    key={a.id}
                    className="border-b border-border/70 pb-2 last:border-0"
                  >
                    <p className="font-medium text-ink">
                      {a.label || a.fromEmail}
                      {a.isDefault ? " · default" : ""}
                      {!a.enabled ? " · off" : ""}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {a.host} · {a.fromEmail}
                    </p>
                    <Link
                      href={`/admin/customers/${a.user.id}`}
                      className="text-[12px] font-semibold text-brand-600 hover:underline"
                    >
                      {a.user.companyName || a.user.email}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </HudPanel>

        <HudPanel title="Nurture sequences" subtitle="Day 1 / 2 / 3 automation">
          {!side ? (
            <p className="animate-pulse text-sm text-ink-muted">Loading…</p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto text-[13px]">
              {side.sequences.length === 0 ? (
                <li className="text-ink-muted">No sequences yet.</li>
              ) : (
                side.sequences.map((s) => (
                  <li
                    key={s.id}
                    className="border-b border-border/70 pb-2 last:border-0"
                  >
                    <p className="font-medium text-ink">
                      {s.name}{" "}
                      <span
                        className={
                          s.enabled
                            ? "text-emerald-600"
                            : "text-ink-faint"
                        }
                      >
                        {s.enabled ? "on" : "off"}
                      </span>
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {s._count.enrollments} enrollments
                    </p>
                    <Link
                      href={`/admin/customers/${s.user.id}`}
                      className="text-[12px] font-semibold text-brand-600 hover:underline"
                    >
                      {s.user.companyName || s.user.email}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </HudPanel>
      </div>
    </div>
  );
}
