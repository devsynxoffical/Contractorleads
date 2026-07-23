"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineCog6Tooth,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { SetupShell } from "@/components/setup/setup-shell";
import { cn } from "@/lib/utils";

type StatusPayload = {
  email: boolean;
  api: boolean;
  crm: boolean;
  profile: boolean;
};

function SetupCard({
  href,
  title,
  body,
  ready,
  cta,
  icon: Icon,
}: {
  href: string;
  title: string;
  body: string;
  ready: boolean;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:shadow-[var(--shadow-elevated)]",
        ready ? "border-emerald-500/35" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-[var(--canvas)] dark:bg-brand-500 dark:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            ready
              ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300"
              : "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-200",
          )}
        >
          {ready ? (
            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
          ) : (
            <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
          )}
          {ready ? "Ready" : "Needs setup"}
        </span>
      </div>
      <h2 className="mt-4 text-[17px] font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">
        {body}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink group-hover:gap-2">
        {cta}
        <HiOutlineArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function SetupHubPage() {
  const [status, setStatus] = useState<StatusPayload>({
    email: false,
    api: false,
    crm: false,
    profile: false,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/smtp-accounts").then((r) => r.json()).catch(() => ({})),
      fetch("/api/user/api-access").then((r) => r.json()).catch(() => ({})),
      fetch("/api/settings/crm-webhook").then((r) => r.json()).catch(() => ({})),
      fetch("/api/dashboard/stats").then((r) => r.json()).catch(() => ({})),
    ]).then(([smtp, api, crm, dash]) => {
      const emailReady = Boolean(
        (smtp.accounts ?? []).some(
          (a: { enabled?: boolean; fromEmail?: string }) =>
            a.enabled && a.fromEmail,
        ),
      );
      const apiReady = Boolean(
        api.access?.apiEnabled ||
          api.access?.mcpEnabled ||
          api.access?.ssoEnabled,
      );
      const crmReady = Boolean(
        (crm.webhook?.enabled && crm.webhook?.url) ||
          (crm.slack?.enabled && crm.slack?.url) ||
          (crm.ghl?.enabled && crm.ghl?.url),
      );
      setStatus({
        email: emailReady,
        api: apiReady && Boolean(api.access?.apiKeyLast4),
        crm: crmReady,
        profile: Boolean(dash.integrations?.onboardingComplete),
      });
    });
  }, []);

  const statuses = {
    "/setup/email": status.email,
    "/setup/api": status.api,
    "/setup/crm": status.crm,
    "/settings": status.profile,
  };

  const doneCount = [status.email, status.api, status.crm, status.profile].filter(
    Boolean,
  ).length;

  return (
    <SetupShell
      title="Get your workspace ready"
      description="Set up email, API access, and CRM sync on their own pages — not buried in Settings. Finish these once and your team can sell."
      statuses={statuses}
    >
      <div className="rounded-2xl border border-border bg-ink p-5 text-[var(--canvas)] dark:bg-gradient-to-br dark:from-brand-700 dark:to-[#1a1228] dark:text-white sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--canvas)]/70 dark:text-white/70">
          Setup progress
        </p>
        <p className="mt-1 text-[28px] font-semibold tabular-nums">
          {doneCount}
          <span className="text-[16px] font-medium text-[var(--canvas)]/55 dark:text-white/55">
            {" "}
            / 4
          </span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--canvas)]/20 dark:bg-white/15">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${(doneCount / 4) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-[13px] text-[var(--canvas)]/75 dark:text-white/75">
          Recommended order: Email → API → CRM → Business profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SetupCard
          href="/setup/email"
          title="Email & SMTP"
          body="Add Gmail, Outlook, or custom SMTP mailboxes. Send one-off emails from lead detail and run Day 1–3 nurture sequences."
          ready={status.email}
          cta={status.email ? "Manage mailboxes" : "Connect email"}
          icon={HiOutlineEnvelope}
        />
        <SetupCard
          href="/setup/api"
          title="API · MCP · SSO"
          body="Generate your live API key, see plan limits, and wire REST, MCP, or SSO search endpoints into your stack."
          ready={status.api}
          cta={status.api ? "Manage API access" : "Enable API access"}
          icon={HiOutlineKey}
        />
        <SetupCard
          href="/setup/crm"
          title="CRM webhooks"
          body="Push lead.saved and pipeline stage events to Slack, GoHighLevel, Zapier, Make, or HubSpot."
          ready={status.crm}
          cta={status.crm ? "Manage CRM sync" : "Connect CRM"}
          icon={HiOutlineLink}
        />
        <SetupCard
          href="/settings"
          title="Business profile"
          body="Company name, services, and ideal customer — used in outreach templates and reports."
          ready={status.profile}
          cta="Edit profile"
          icon={HiOutlineCog6Tooth}
        />
      </div>
    </SetupShell>
  );
}
