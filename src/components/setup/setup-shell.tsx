"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HiOutlineCheckCircle,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { BackLink, PageCrumbs } from "@/components/layout/back-nav";

const STEPS = [
  {
    href: "/setup",
    label: "Overview",
    icon: HiOutlineSquares2X2,
    match: (p: string) => p === "/setup",
  },
  {
    href: "/setup/email",
    label: "Email & SMTP",
    icon: HiOutlineEnvelope,
    match: (p: string) => p.startsWith("/setup/email"),
  },
  {
    href: "/setup/api",
    label: "API · MCP · SSO",
    icon: HiOutlineKey,
    match: (p: string) => p.startsWith("/setup/api"),
  },
  {
    href: "/setup/crm",
    label: "CRM webhooks",
    icon: HiOutlineLink,
    match: (p: string) => p.startsWith("/setup/crm") || p === "/crm-webhooks",
  },
  {
    href: "/settings",
    label: "Business profile",
    icon: HiOutlineCog6Tooth,
    match: (p: string) => p === "/settings",
  },
];

export function SetupNav({
  statuses,
}: {
  statuses?: Partial<Record<string, boolean>>;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
      {STEPS.map((step) => {
        const active = step.match(pathname);
        const done = statuses?.[step.href];
        return (
          <Link
            key={step.href}
            href={step.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
              active
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                : "text-ink-muted hover:bg-brand-50/60 hover:text-ink",
            )}
          >
            <step.icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-brand-600" : "opacity-70",
              )}
            />
            <span className="flex-1 whitespace-nowrap">{step.label}</span>
            {done ? (
              <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function SetupShell({
  title,
  description,
  children,
  statuses,
  steps,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  statuses?: Partial<Record<string, boolean>>;
  steps?: Array<{ title: string; body: string }>;
}) {
  const pathname = usePathname();
  const isHub = pathname === "/setup";
  const backHref = isHub ? "/dashboard" : "/setup";
  const backLabel = isHub ? "Back to dashboard" : "Back to setup hub";
  const crumbLabel =
    STEPS.find((s) => s.match(pathname))?.label ?? title;

  return (
    <div className="page-pad">
      <div className="mb-6 space-y-2">
        <BackLink href={backHref} label={backLabel} />
        <PageCrumbs
          items={
            isHub
              ? [
                  { label: "Home", href: "/home" },
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Setup" },
                ]
              : [
                  { label: "Home", href: "/home" },
                  { label: "Setup", href: "/setup" },
                  { label: crumbLabel },
                ]
          }
        />
        <p className="pt-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          Workspace setup
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-border bg-[var(--surface)] p-2 shadow-[var(--shadow-soft)] lg:sticky lg:top-24">
          <SetupNav statuses={statuses} />
          {steps?.length ? (
            <ol className="mt-3 hidden space-y-3 border-t border-border px-2 pb-2 pt-4 lg:block">
              <li className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                On this page
              </li>
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-2.5 text-[12px]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 ring-1 ring-brand-200">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-semibold text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-ink-muted">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </aside>
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
    </div>
  );
}
