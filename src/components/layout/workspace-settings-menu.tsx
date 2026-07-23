"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HiOutlineChevronRight,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineLockClosed,
  HiOutlinePuzzlePiece,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { planLabel } from "@/lib/plans";
import { userHasPlanFeature } from "@/lib/plan-access";
import type { SessionUser } from "@/lib/session-user";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
  lockHint?: string;
};

function useSetupProgress(user: SessionUser) {
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) return;
        const data = await res.json();
        const integ = data.integrations;
        if (!integ || cancelled) return;
        const checks = [
          Boolean(user.onboardingComplete || user.companyName),
          Boolean(integ.emailAutomation?.smtpConfigured),
          Boolean(integ.apiAccess?.hasKey),
          Boolean(
            integ.crmWebhook?.connected ||
              integ.slack?.connected ||
              integ.ghl?.connected,
          ),
        ];
        const done = checks.filter(Boolean).length;
        if (!cancelled) {
          setProgress(Math.max(8, Math.round((done / checks.length) * 100)));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.companyName, user.onboardingComplete]);

  return progress;
}

export function WorkspaceSettingsMenu({
  user,
  variant = "sidebar",
  onNavigate,
  className,
}: {
  user: SessionUser;
  variant?: "sidebar" | "header";
  onNavigate?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const progress = useSetupProgress(user);
  const canTeams = userHasPlanFeature(user, "teams");

  const items: MenuItem[] = [
    {
      href: canTeams ? "/team" : "/billing",
      label: "Users and teams",
      icon: HiOutlineUserGroup,
      locked: !canTeams,
      lockHint: "Agency plan",
    },
    {
      href: "/billing",
      label: "Billing and plan usage",
      icon: HiOutlineCreditCard,
    },
    {
      href: "/settings/security",
      label: "Security",
      icon: HiOutlineLockClosed,
    },
    {
      href: "/setup",
      label: "Integrations",
      icon: HiOutlinePuzzlePiece,
    },
  ];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition",
            open
              ? "bg-brand-50 text-ink"
              : "text-ink-muted hover:bg-brand-50 hover:text-ink",
          )}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <HiOutlineCog6Tooth className="h-[18px] w-[18px] shrink-0 text-ink-faint" />
          <span className="flex-1 truncate text-left">Workspace settings</span>
          <HiOutlineChevronRight
            className={cn(
              "h-4 w-4 text-ink-faint transition",
              open && "rotate-90",
            )}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-1.5 transition hover:border-border hover:bg-brand-50 sm:pr-2.5"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <div
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-brand-500/35"
            style={{ background: "var(--logo-gradient)" }}
          >
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="hidden min-w-0 max-w-[130px] md:block text-left">
            <p className="truncate text-[12px] font-semibold tracking-tight text-ink">
              {user.name || "User"}
            </p>
            <p className="truncate text-[10px] font-medium capitalize text-ink-faint">
              {planLabel(user.plan)}
            </p>
          </div>
        </button>
      )}

      {open ? (
        <div
          role="dialog"
          aria-label="Team and workspace setup"
          className={cn(
            "absolute z-50 w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]",
            variant === "sidebar"
              ? "bottom-[calc(100%+8px)] left-0 right-0 w-auto"
              : "right-0 top-[calc(100%+8px)]",
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">
              Team &amp; Workspace setup
            </p>
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-ink-faint">
                <span>{progress}% completed</span>
                <span className="capitalize">{planLabel(user.plan)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: "var(--logo-gradient)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="py-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-slate-50"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
                  <span className="flex-1">{item.label}</span>
                  {item.locked ? (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      {item.lockHint}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border py-1.5">
            <Link
              href="/settings"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-slate-50"
            >
              <HiOutlineCog6Tooth className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
              <span className="flex-1">All settings</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
