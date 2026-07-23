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
    <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
      {STEPS.map((step) => {
        const active = step.match(pathname);
        const done = statuses?.[step.href];
        return (
          <Link
            key={step.href}
            href={step.href}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <step.icon className="h-4 w-4 shrink-0 opacity-80" />
            <span className="flex-1">{step.label}</span>
            {done ? (
              <HiOutlineCheckCircle
                className={cn(
                  "h-4 w-4",
                  active ? "text-emerald-300" : "text-emerald-600",
                )}
              />
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
  return (
    <div className="page-pad">
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Workspace setup
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SetupNav statuses={statuses} />
          {steps?.length ? (
            <ol className="mt-6 hidden space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:block">
              <li className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                On this page
              </li>
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-2.5 text-[12px]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-semibold text-slate-800">{s.title}</span>
                    <span className="mt-0.5 block text-slate-500">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
