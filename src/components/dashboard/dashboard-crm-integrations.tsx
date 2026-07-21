"use client";

import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLink,
  HiOutlineEnvelope,
  HiOutlineViewColumns,
  HiOutlineArrowDownTray,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { SiMeta, SiZapier, SiHubspot } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { HudPanel } from "@/components/dashboard/hud-panel";

export type DashboardPipeline = {
  new: number;
  contacted: number;
  qualified: number;
  closed: number;
};

export type DashboardIntegrations = {
  crmWebhook: { connected: boolean; enabled: boolean; hasUrl: boolean };
  emailAutomation: { smtpConfigured: boolean; sequenceEnabled: boolean };
  facebook: { configured: boolean; customAudience: boolean };
  dataSources: { googlePlaces: boolean; yelp: boolean; linkedin: boolean };
  exports: { csv: boolean; excel: boolean; pdf: boolean };
  onboardingComplete: boolean;
};

function StatusDot({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        ok && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
        warn && !ok && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]",
        !ok && !warn && "bg-slate-500/70",
      )}
      aria-hidden
    />
  );
}

function IntegrationCard({
  href,
  title,
  body,
  status,
  statusLabel,
  icon: Icon,
  brand,
}: {
  href: string;
  title: string;
  body: string;
  status: "ready" | "setup" | "partial" | "roadmap";
  statusLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  brand?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-brand-500/20 bg-[var(--panel-solid)] p-4 transition hover:border-brand-500/45 hover:bg-brand-500/[0.06]"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/10"
          style={brand ? { color: brand } : undefined}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            status === "ready" && "bg-emerald-500/15 text-emerald-300",
            status === "setup" && "bg-amber-500/15 text-amber-200",
            status === "partial" && "bg-violet-500/15 text-violet-200",
            status === "roadmap" && "bg-white/5 text-ink-faint",
          )}
        >
          <StatusDot
            ok={status === "ready"}
            warn={status === "setup" || status === "partial"}
          />
          {statusLabel}
        </span>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
      <p className="mt-1 flex-1 text-[12px] leading-relaxed text-ink-muted">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-400 group-hover:text-brand-300">
        Open <HiOutlineArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export function DashboardCrmIntegrations({
  pipeline,
  integrations,
}: {
  pipeline?: DashboardPipeline | null;
  integrations?: DashboardIntegrations | null;
}) {
  const p = pipeline ?? { new: 0, contacted: 0, qualified: 0, closed: 0 };
  const total = p.new + p.contacted + p.qualified + p.closed;
  const stages = [
    { key: "new", label: "New", count: p.new, color: "#a855f7" },
    { key: "contacted", label: "Contacted", count: p.contacted, color: "#38bdf8" },
    { key: "qualified", label: "Qualified", count: p.qualified, color: "#34d399" },
    { key: "closed", label: "Closed", count: p.closed, color: "#f472b6" },
  ];

  const i = integrations;
  const webhookReady = Boolean(i?.crmWebhook.connected);
  const smtpReady = Boolean(i?.emailAutomation.smtpConfigured);
  const sequenceOn = Boolean(i?.emailAutomation.sequenceEnabled);

  return (
    <div className="space-y-5">
      <HudPanel
        title="Pipeline CRM"
        subtitle="New → Contacted → Qualified → Closed"
        actions={
          <Link href="/leads/pipeline" className="hud-btn-ghost text-[11px]">
            Open board
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {stages.map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0;
            return (
              <Link
                key={s.key}
                href="/leads/pipeline"
                className="rounded-xl border border-brand-500/15 bg-[var(--input-bg)]/40 p-3 transition hover:border-brand-500/35"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  {s.label}
                </p>
                <p className="mt-1 text-[22px] font-bold tabular-nums text-ink">{s.count}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(pct, s.count ? 8 : 0)}%`, background: s.color }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/leads/pipeline" className="hud-btn-primary">
            <HiOutlineViewColumns className="h-4 w-4" />
            Manage pipeline
          </Link>
          <Link href="/leads/saved" className="hud-btn-ghost">
            Saved leads
          </Link>
          <Link href="/leads/hot" className="hud-btn-ghost">
            Hot queue
          </Link>
        </div>
      </HudPanel>

      <HudPanel
        title="Integrations & automation"
        subtitle="CRM push · email sequences · data sources · exports"
        actions={
          <span className="hud-pill">
            {[
              webhookReady,
              smtpReady,
              Boolean(i?.dataSources.googlePlaces),
            ].filter(Boolean).length}
            /3 core live
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <IntegrationCard
            href="/crm-webhooks"
            title="CRM webhooks"
            body="Push lead events to Zapier, Make, HubSpot, or a custom endpoint the moment status changes."
            status={webhookReady ? "ready" : i?.crmWebhook.hasUrl ? "partial" : "setup"}
            statusLabel={webhookReady ? "Connected" : i?.crmWebhook.hasUrl ? "Paused" : "Setup"}
            icon={HiOutlineLink}
          />
          <IntegrationCard
            href="/settings"
            title="Email automation"
            body="Day 1–3 nurture sequences from your own SMTP (Gmail, Outlook, or custom mail)."
            status={
              smtpReady && sequenceOn
                ? "ready"
                : smtpReady
                  ? "partial"
                  : "setup"
            }
            statusLabel={
              smtpReady && sequenceOn
                ? "Active"
                : smtpReady
                  ? "SMTP only"
                  : "Setup SMTP"
            }
            icon={HiOutlineEnvelope}
          />
          <IntegrationCard
            href="/facebook-ads"
            title="Meta / Facebook"
            body={
              i?.facebook.customAudience
                ? "Custom Audience sync is connected."
                : "Ads Library intel is available. Custom Audience sync is on the roadmap."
            }
            status={i?.facebook.customAudience ? "ready" : "roadmap"}
            statusLabel={i?.facebook.customAudience ? "Synced" : "Roadmap"}
            icon={SiMeta}
            brand="#0866FF"
          />
          <IntegrationCard
            href="/leads"
            title="CSV & Excel export"
            body="Export verified lead fields only — blank LinkedIn/socials when unverified. PDF export still deferred."
            status="ready"
            statusLabel="CSV · XLSX"
            icon={HiOutlineArrowDownTray}
          />
          <IntegrationCard
            href="/leads/search"
            title="Data sources"
            body={`Places ${i?.dataSources.googlePlaces ? "on" : "off"} · Yelp ${i?.dataSources.yelp ? "on" : "off"} · LinkedIn verify ${i?.dataSources.linkedin ? "on" : "off"}. Verified or blank.`}
            status={
              i?.dataSources.googlePlaces
                ? i.dataSources.yelp || i.dataSources.linkedin
                  ? "ready"
                  : "partial"
                : "setup"
            }
            statusLabel={i?.dataSources.googlePlaces ? "Places live" : "Needs key"}
            icon={HiOutlineSparkles}
          />
          <IntegrationCard
            href="/crm-webhooks"
            title="Zapier · Make · HubSpot"
            body="Point any of these tools at your LeadFlow webhook URL — no native OAuth apps required."
            status={webhookReady ? "ready" : "setup"}
            statusLabel={webhookReady ? "Via webhook" : "Connect URL"}
            icon={SiZapier}
            brand="#FF4A00"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-500/15 bg-brand-500/[0.04] px-4 py-3 text-[12px] text-ink-muted">
          {webhookReady ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <HiOutlineCheckCircle className="h-4 w-4" /> CRM webhook live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-200">
              <HiOutlineExclamationCircle className="h-4 w-4" /> Connect CRM webhook to auto-push leads
            </span>
          )}
          <span className="text-ink-faint">·</span>
          <span className="inline-flex items-center gap-1.5">
            <FaLinkedinIn className="h-3.5 w-3.5 text-[#0A66C2]" />
            LinkedIn: verified ≥95% or “Not Available”
          </span>
          <span className="text-ink-faint">·</span>
          <span className="inline-flex items-center gap-1.5">
            <SiHubspot className="h-3.5 w-3.5 text-[#FF7A59]" />
            HubSpot via webhook
          </span>
          <Link
            href="/crm-webhooks"
            className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300"
          >
            <HiOutlineArrowPath className="h-3.5 w-3.5" />
            Configure
          </Link>
        </div>
      </HudPanel>
    </div>
  );
}
