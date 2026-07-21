"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  NavigationProgress,
  startNavigationProgress,
} from "@/components/layout/navigation-progress";
import {
  HiOutlineArrowLeft,
  HiOutlineBanknotes,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentDuplicate,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineKey,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineGlobeAlt,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-user";
import { SUPER_ADMIN_ROLE } from "@/lib/roles";
import {
  firstAllowedAdminPath,
  permissionForPath,
  type AdminPermissionKey,
} from "@/lib/admin-permissions";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  permission: AdminPermissionKey | "staff";
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Business Overview", icon: HiOutlineHome, permission: "overview" },
  { href: "/admin/customers", label: "Customers", icon: HiOutlineUsers, permission: "customers" },
  { href: "/admin/site-leads", label: "Site Leads", icon: HiOutlineGlobeAlt, permission: "customers" },
  { href: "/admin/leads", label: "All Leads", icon: HiOutlineSquares2X2, permission: "leads" },
  { href: "/admin/saved-leads", label: "Saved Leads", icon: HiOutlineStar, permission: "saved_leads" },
  { href: "/admin/searches", label: "All Searches", icon: HiOutlineClipboardDocumentList, permission: "searches" },
  { href: "/admin/scrape", label: "Scrape Leads", icon: HiOutlineMagnifyingGlass, permission: "scrape" },
  { href: "/admin/copy-leads", label: "Copy Leads", icon: HiOutlineDocumentDuplicate, permission: "copy_leads" },
  { href: "/admin/revenue", label: "Revenue & Subscriptions", icon: HiOutlineBanknotes, permission: "revenue" },
  { href: "/admin/activity", label: "Activity Log", icon: HiOutlineClipboardDocumentList, permission: "activity" },
  { href: "/admin/health", label: "Feature Health Audit", icon: HiOutlineHeart, permission: "health" },
  { href: "/admin/system", label: "System & API Keys", icon: HiOutlineKey, permission: "system" },
  { href: "/admin/email-preview", label: "Email Templates", icon: HiOutlineEnvelope, permission: "system" },
  { href: "/admin/team", label: "Team & Roles", icon: HiOutlineUserGroup, permission: "staff" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function canAccess(
  user: SessionUser,
  permission: AdminPermissionKey | "staff"
) {
  if (user.role === SUPER_ADMIN_ROLE) return true;
  if (permission === "staff") return false;
  return (user.permissions ?? []).includes(permission);
}

function AdminRouteGuard({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = (user.permissions ?? []) as AdminPermissionKey[];
  const isSuper = user.role === SUPER_ADMIN_ROLE;

  useEffect(() => {
    const needed = permissionForPath(pathname);
    if (!needed) return;
    if (needed === "staff") {
      if (!isSuper) {
        router.replace(firstAllowedAdminPath(permissions));
      }
      return;
    }
    if (!isSuper && !permissions.includes(needed)) {
      router.replace(firstAllowedAdminPath(permissions));
    }
  }, [pathname, permissions, isSuper, router]);

  return <>{children}</>;
}

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleNav = NAV.filter((item) => canAccess(user, item.permission));
  const roleLabel =
    user.role === SUPER_ADMIN_ROLE
      ? "Super Admin"
      : user.role === "MANAGER"
        ? "Manager"
        : user.role === "SUB_ADMIN"
          ? "Sub Admin"
          : "Admin";

  return (
    <div className="admin-shell--hud app-shell--hud flex min-h-[100dvh]">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      <aside className="hud-shell-aside hidden w-[260px] shrink-0 flex-col lg:flex">
        <div className="border-b border-brand-500/15 px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-500">
                {roleLabel}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
                Control Panel
              </p>
              <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                {user.email}
              </p>
            </div>
            <ThemeToggle compact />
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "saas-nav-active bg-brand-500/12 text-brand-500 shadow-[0_0_20px_var(--brand-glow)]"
                    : "text-ink-muted hover:bg-brand-50 hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-brand-500/15 p-3">
          {user.role === SUPER_ADMIN_ROLE && (
            <Link
              href="/home"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-muted transition hover:bg-brand-50 hover:text-ink"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              startNavigationProgress();
              await fetch("/api/admin/auth/logout", { method: "POST" });
              router.push("/admin/login");
              router.refresh();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-muted transition hover:bg-brand-50 hover:text-ink"
          >
            Sign out of admin
          </button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="hud-viewport-bg pointer-events-none absolute inset-0" />

        <header className="hud-shell-header relative z-[1] flex items-center gap-3 px-4 py-3 lg:hidden">
          <HiOutlineClipboardDocumentList className="h-5 w-5 text-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{roleLabel}</p>
            <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
          </div>
          <ThemeToggle compact />
        </header>

        <div className="scrollbar-thin relative z-[1] flex gap-2 overflow-x-auto border-b border-brand-500/10 bg-[var(--surface)] px-3 py-2 lg:hidden">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold",
                isActive(pathname, item.href)
                  ? "bg-brand-500/15 text-brand-500"
                  : "bg-white/[0.04] text-[#8b9aab]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="hud-shell-main scrollbar-thin relative z-[1] flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AdminRouteGuard user={user}>{children}</AdminRouteGuard>
        </main>
      </div>
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="hud-panel !p-4">
      <span className="hud-bracket hud-bracket-tl" aria-hidden />
      <span className="hud-bracket hud-bracket-tr" aria-hidden />
      <span className="hud-bracket hud-bracket-bl" aria-hidden />
      <span className="hud-bracket hud-bracket-br" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <p className="hud-stat-value mt-1 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-brand-500 [text-shadow:0_0_24px_var(--brand-glow)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
