"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";

type PlatformPayload = {
  summary: {
    customers: number;
    suspended: number;
    leads: number;
    savedLeads: number;
    searches: number;
    exports: number;
    scripts: number;
    aiChats: number;
    teamSeats: number;
    smtpAccounts: number;
    sequencesEnabled: number;
    leadEmails: number;
    leadSms: number;
    referrals: number;
    crmConnected: number;
    slackConnected: number;
    ghlConnected: number;
    apiKeyed: number;
    marketingOptOut: number;
  };
  planMix: Array<{
    plan: string;
    label: string;
    count: number;
    share: number;
    priceMonthly: number;
    total: number;
  }>;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    metric: string;
    status: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    user: {
      email: string;
      companyName: string | null;
      name: string | null;
    };
  }>;
};

export default function AdminPlatformPage() {
  const [data, setData] = useState<PlatformPayload | null>(null);

  useEffect(() => {
    fetch("/api/admin/platform")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const s = data?.summary;

  return (
    <div>
      <AdminPageHeader
        title="Platform Control"
        description="Complete Super Admin map of every controllable surface — customers, leads, plans, email, integrations, staff, and system health."
      />

      {!data ? (
        <p className="text-sm text-ink-muted animate-pulse">Loading control center…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label="Customers"
              value={s!.customers}
              hint={`${s!.suspended} suspended`}
            />
            <AdminStatCard
              label="Lead pool"
              value={s!.leads}
              hint={`${s!.savedLeads} saved · ${s!.searches} searches`}
            />
            <AdminStatCard
              label="Outreach"
              value={s!.leadEmails + s!.leadSms}
              hint={`${s!.leadEmails} emails · ${s!.leadSms} SMS · ${s!.smtpAccounts} SMTP`}
            />
            <AdminStatCard
              label="Integrations"
              value={s!.apiKeyed + s!.crmConnected + s!.slackConnected + s!.ghlConnected}
              hint={`${s!.apiKeyed} API · ${s!.crmConnected} CRM · ${s!.teamSeats} seats`}
            />
          </div>

          <div className="mb-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <HudPanel
              title="Everything you can manage"
              subtitle="No orphan features — each product area has an admin path"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {data.modules.map((m) => (
                  <Link
                    key={m.id}
                    href={m.href}
                    className="rounded-xl border border-brand-500/15 bg-white/[0.03] px-3.5 py-3 transition hover:border-brand-500/40 hover:bg-brand-500/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-ink">{m.title}</p>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                        Open
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{m.description}</p>
                    <p className="mt-2 text-[11px] tabular-nums text-ink-faint">
                      {m.metric}
                    </p>
                  </Link>
                ))}
              </div>
            </HudPanel>

            <div className="space-y-5">
              <HudPanel
                title="Customers by plan"
                subtitle={`How your ${data.planMix[0]?.total ?? 0} customer${(data.planMix[0]?.total ?? 0) === 1 ? "" : "s"} split across plans`}
              >
                {(data.planMix[0]?.total ?? 0) === 0 ? (
                  <p className="text-sm text-ink-muted">No customers yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.planMix.map((p) => (
                      <li key={p.plan}>
                        <div className="flex items-baseline justify-between text-[13px]">
                          <span className="font-medium text-ink">
                            {p.label}
                            <span className="ml-1.5 text-[11px] font-normal text-ink-faint">
                              {p.priceMonthly > 0
                                ? `$${p.priceMonthly}/mo`
                                : p.plan === "enterprise"
                                  ? "custom"
                                  : ""}
                            </span>
                          </span>
                          <span className="tabular-nums text-ink-muted">
                            <span className="font-semibold text-ink">
                              {p.count}
                            </span>{" "}
                            {p.count === 1 ? "customer" : "customers"} ·{" "}
                            {p.share}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-500/10">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${Math.max(p.share, p.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/admin/plans"
                  className="mt-4 inline-block text-[12px] font-semibold text-brand-500 hover:underline"
                >
                  Edit plan features & pricing →
                </Link>
              </HudPanel>

              <HudPanel title="Recent activity" subtitle="Latest product events">
                <ul className="space-y-2">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="border-b border-white/[0.04] pb-2 text-[12px]">
                      <p className="text-ink">{a.message}</p>
                      <p className="mt-0.5 text-ink-faint">
                        {a.user.companyName || a.user.name || a.user.email} ·{" "}
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
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
