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
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { SUPER_ADMIN_ROLE } from "@/lib/auth";
import {
  firstAllowedAdminPath,
  permissionForPath,
  type AdminPermissionKey,
} from "@/lib/admin-permissions";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  permission: AdminPermissionKey | "staff";
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Business Overview", icon: HiOutlineHome, permission: "overview" },
  { href: "/admin/customers", label: "Customers", icon: HiOutlineUsers, permission: "customers" },
  { href: "/admin/leads", label: "All Leads", icon: HiOutlineSquares2X2, permission: "leads" },
  { href: "/admin/saved-leads", label: "Saved Leads", icon: HiOutlineStar, permission: "saved_leads" },
  { href: "/admin/searches", label: "All Searches", icon: HiOutlineClipboardDocumentList, permission: "searches" },
  { href: "/admin/scrape", label: "Scrape Leads", icon: HiOutlineMagnifyingGlass, permission: "scrape" },
  { href: "/admin/copy-leads", label: "Copy Leads", icon: HiOutlineDocumentDuplicate, permission: "copy_leads" },
  { href: "/admin/revenue", label: "Revenue & Subscriptions", icon: HiOutlineBanknotes, permission: "revenue" },
  { href: "/admin/activity", label: "Activity Log", icon: HiOutlineClipboardDocumentList, permission: "activity" },
  { href: "/admin/health", label: "Feature Health Audit", icon: HiOutlineHeart, permission: "health" },
  { href: "/admin/system", label: "System & API Keys", icon: HiOutlineKey, permission: "system" },
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
    <div className="flex min-h-[100dvh] bg-[#f4f1f7]">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border/80 bg-white lg:flex">
        <div className="border-b border-border/80 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            {roleLabel}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
            Control Panel
          </p>
          <p className="mt-0.5 truncate text-[12px] text-ink-muted">
            {user.email}
          </p>
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
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-muted hover:bg-[#f7f4fa] hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/80 p-3 space-y-1">
          {user.role === SUPER_ADMIN_ROLE && (
            <Link
              href="/home"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-muted transition hover:bg-[#f7f4fa] hover:text-ink"
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
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-muted transition hover:bg-[#f7f4fa] hover:text-ink"
          >
            Sign out of admin
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border/80 bg-white px-4 py-3 lg:hidden">
          <HiOutlineClipboardDocumentList className="h-5 w-5 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{roleLabel}</p>
            <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
          </div>
        </header>

        <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-3 py-2 lg:hidden">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold",
                isActive(pathname, item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "bg-[#faf8fc] text-ink-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
    <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-ink">
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
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink">
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
