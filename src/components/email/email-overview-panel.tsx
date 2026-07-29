"use client";

import Link from "next/link";
import {
  HiOutlineCheckCircle,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlineExclamationTriangle,
  HiOutlineInbox,
  HiOutlinePaperAirplane,
  HiOutlineQueueList,
  HiOutlineUsers,
} from "react-icons/hi2";
import { Button, buttonVariants } from "@/components/ui/button";
import { MESSAGING_ADDON_PRICE_USD } from "@/lib/messaging-addon";
import { cn } from "@/lib/utils";

export type EmailHubTab =
  | "overview"
  | "inbox"
  | "compose"
  | "bulk"
  | "setup"
  | "sequences"
  | "activity";

type Step = {
  n: number;
  title: string;
  body: string;
  tab?: EmailHubTab;
  href?: string;
  cta: string;
  done?: boolean;
  warn?: boolean;
};

export function EmailOverviewPanel({
  smtpReady,
  hasAddon,
  onGo,
}: {
  smtpReady: boolean;
  hasAddon: boolean;
  onGo: (tab: EmailHubTab) => void;
}) {
  const steps: Step[] = [
    {
      n: 1,
      title: "Connect your mailbox",
      body: "Add a Resend or SMTP sender so every lead email goes from your domain.",
      tab: "setup",
      cta: smtpReady ? "Manage mailboxes" : "Setup email",
      done: smtpReady,
      warn: !smtpReady,
    },
    {
      n: 2,
      title: "Email one lead",
      body: "Search any saved lead with an email, write your pitch, and send from your mailbox.",
      tab: "compose",
      cta: "Compose email",
      done: smtpReady,
    },
    {
      n: 3,
      title: "Bulk email many leads",
      body: `Select up to 200 saved leads and send one campaign. Requires Messaging add-on ($${MESSAGING_ADDON_PRICE_USD.toFixed(2)}/mo).`,
      tab: "bulk",
      cta: hasAddon ? "Open bulk send" : "Unlock bulk email",
      done: hasAddon && smtpReady,
      warn: !hasAddon,
    },
    {
      n: 4,
      title: "Read replies in Inbox",
      body: "When inbound email is wired, lead replies land here so you can respond in thread.",
      tab: "inbox",
      cta: "Open inbox",
    },
    {
      n: 5,
      title: "Nurture sequences",
      body: "Build Day 1–N follow-ups, then enroll leads from Saved leads or lead detail.",
      tab: "sequences",
      cta: "Edit sequences",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label="Mailbox"
          ok={smtpReady}
          okText="Connected"
          badText="Not connected"
          action={
            <Button
              size="sm"
              variant={smtpReady ? "secondary" : "default"}
              onClick={() => onGo("setup")}
            >
              <HiOutlineCog6Tooth className="mr-1.5 h-3.5 w-3.5" />
              {smtpReady ? "Manage" : "Setup email"}
            </Button>
          }
        />
        <StatusCard
          label="Bulk & SMS add-on"
          ok={hasAddon}
          okText="Active"
          badText="Not active"
          action={
            hasAddon ? (
              <Button size="sm" variant="secondary" onClick={() => onGo("bulk")}>
                <HiOutlineUsers className="mr-1.5 h-3.5 w-3.5" />
                Bulk send
              </Button>
            ) : (
              <Link
                href="/billing"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Unlock · ${MESSAGING_ADDON_PRICE_USD.toFixed(2)}/mo
              </Link>
            )
          }
        />
        <StatusCard
          label="Quick send"
          ok={smtpReady}
          okText="Ready"
          badText="Needs mailbox"
          action={
            <Button
              size="sm"
              variant="secondary"
              disabled={!smtpReady}
              onClick={() => onGo("compose")}
            >
              <HiOutlinePaperAirplane className="mr-1.5 h-3.5 w-3.5" />
              Compose
            </Button>
          }
        />
        <StatusCard
          label="Inbox"
          ok
          okText="Open anytime"
          badText=""
          action={
            <Button size="sm" variant="secondary" onClick={() => onGo("inbox")}>
              <HiOutlineInbox className="mr-1.5 h-3.5 w-3.5" />
              Inbox
            </Button>
          }
        />
      </div>

      <div>
        <h2 className="text-[16px] font-semibold text-ink">Email workflow</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Follow these steps to pitch leads by email end to end — setup, send,
          bulk, reply, and nurture.
        </p>
        <ol className="mt-4 space-y-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                s.warn
                  ? "border-amber-200 bg-amber-50/60"
                  : s.done
                    ? "border-emerald-200/80 bg-emerald-50/40"
                    : "border-border bg-[var(--surface)]",
              )}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold",
                    s.done
                      ? "bg-emerald-100 text-emerald-800"
                      : s.warn
                        ? "bg-amber-100 text-amber-900"
                        : "bg-brand-50 text-brand-800",
                  )}
                >
                  {s.done ? (
                    <HiOutlineCheckCircle className="h-5 w-5" />
                  ) : s.warn ? (
                    <HiOutlineExclamationTriangle className="h-5 w-5" />
                  ) : (
                    s.n
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
                    {s.body}
                  </p>
                </div>
              </div>
              {s.tab ? (
                <Button
                  size="sm"
                  variant={s.warn ? "default" : "secondary"}
                  className="shrink-0"
                  onClick={() => {
                    if (s.tab === "bulk" && !hasAddon) {
                      window.location.href = "/billing";
                      return;
                    }
                    onGo(s.tab!);
                  }}
                >
                  {s.cta}
                </Button>
              ) : s.href ? (
                <Link
                  href={s.href}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "shrink-0",
                  )}
                >
                  {s.cta}
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          icon={HiOutlineEnvelope}
          title="Saved leads"
          body="Filter emailable leads and enroll sequences."
          href="/leads/saved"
        />
        <QuickLink
          icon={HiOutlineQueueList}
          title="My Scripts"
          body="Reuse email copy and pitch templates."
          href="/scripts"
        />
        <QuickLink
          icon={HiOutlineCog6Tooth}
          title="Full setup page"
          body="Same mailbox tools inside Setup hub."
          href="/setup/email"
        />
      </div>
    </div>
  );
}

function StatusCard({
  label,
  ok,
  okText,
  badText,
  action,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-[var(--surface)] px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[14px] font-semibold",
          ok ? "text-emerald-800" : "text-amber-900",
        )}
      >
        {ok ? okText : badText}
      </p>
      <div className="mt-3">{action}</div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-[var(--surface)] px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[12px] leading-snug text-ink-muted">{body}</p>
    </Link>
  );
}
