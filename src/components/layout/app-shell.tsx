"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  NavigationProgress,
  startNavigationProgress,
} from "@/components/layout/navigation-progress";
import type { IconType } from "react-icons";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowUpTray,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineCpuChip,
  HiOutlineFire,
  HiOutlineHome,
  HiOutlineHomeModern,
  HiOutlineLink,
  HiOutlineMagnifyingGlass,
  HiOutlineMap,
  HiOutlineMegaphone,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineUsers,
  HiOutlineViewColumns,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn, formatCredits } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-user";
import { TopHeader } from "@/components/layout/top-header";
import { SupportChatWidget } from "@/components/ai/support-chat-widget";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  badge?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/home", label: "Home", icon: HiOutlineHome },
      { href: "/dashboard", label: "Business Insights", icon: HiOutlineChartBar },
      { href: "/leads/search", label: "Lead Finder", icon: HiOutlineMagnifyingGlass },
      { href: "/leads", label: "All Leads", icon: HiOutlineSquares2X2 },
      { href: "/leads/saved", label: "Saved Leads", icon: HiOutlineStar },
      { href: "/leads/hot", label: "Hot Leads", icon: HiOutlineFire, badge: true },
      { href: "/leads/pipeline", label: "Pipeline CRM", icon: HiOutlineViewColumns },
      { href: "/leads/map", label: "Lead Map", icon: HiOutlineMap },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      {
        href: "/ask-expert",
        label: "Ask Contractor Leads",
        icon: HiOutlineChatBubbleLeftRight,
      },
      { href: "/scripts", label: "My Scripts", icon: HiOutlineBookOpen },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/industries", label: "Industries", icon: HiOutlineHomeModern },
      { href: "/analytics", label: "Analytics", icon: HiOutlineArrowTrendingDown },
      { href: "/ai-tools", label: "AI Tools", icon: HiOutlineCpuChip },
      { href: "/workspaces", label: "Workspaces", icon: HiOutlineUsers },
      { href: "/reports", label: "Client Reports", icon: HiOutlineArrowUpTray },
      { href: "/facebook-ads", label: "Facebook Ads", icon: HiOutlineMegaphone },
      { href: "/crm-webhooks", label: "CRM Webhooks", icon: HiOutlineLink },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/billing", label: "Plans & Billing", icon: HiOutlineCreditCard },
      { href: "/settings", label: "Settings", icon: HiOutlineCog6Tooth },
    ],
  },
];

function buildSections(user: SessionUser): NavSection[] {
  if (user.role !== "SUPER_ADMIN" && !user.realAdminId) return sections;
  return [
    {
      title: "Admin",
      items: [
        {
          href: "/admin",
          label: "Super Admin",
          icon: HiOutlineCog6Tooth,
        },
      ],
    },
    ...sections,
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/leads") return pathname === "/leads";
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  user,
  onNavigate,
  showClose,
  onClose,
  onCollapse,
  hud = false,
}: {
  user: SessionUser;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
  hud?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    startNavigationProgress();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/80 px-5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[var(--shadow-soft)] ring-1",
            hud
              ? "bg-brand-500/10 ring-brand-500/30"
              : "bg-gradient-to-br from-brand-50 to-white ring-border/80",
          )}
        >
          <Image
            src="/logo.png"
            alt=""
            width={26}
            height={26}
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink">
            Contractor Leads
          </span>
          <span className="block truncate text-[10px] font-medium text-ink-faint">
            LeadFlow USA
          </span>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="hidden shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-brand-50 hover:text-ink lg:inline-flex"
            aria-label="Hide side menu"
            title="Hide side menu"
          >
            <HiOutlineChevronDoubleLeft className="h-4 w-4" />
          </button>
        )}
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-brand-50 hover:text-ink"
            aria-label="Close menu"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {buildSections(user).map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200",
                      active
                        ? "saas-nav-active"
                        : "text-ink-muted hover:bg-[#f7f4fa] hover:text-ink"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        active
                          ? "text-brand-600"
                          : "text-ink-faint group-hover:text-ink-muted"
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#a855f7] shadow-[0_0_6px_#a855f7]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/80 p-4">
        <div
          className={cn(
            "hud-credits-card relative overflow-hidden rounded-2xl p-3.5 ring-1",
            hud
              ? "bg-brand-500/10 ring-brand-500/25"
              : "bg-gradient-to-br from-[#fcf2f8] via-white to-[#f3eef8] ring-brand-100/80",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Credits
          </p>
          <p
            className={cn(
              "mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums tracking-tight",
              hud ? "text-brand-500" : "text-brand-700",
            )}
          >
            {formatCredits(user.creditsRemaining)}
          </p>
          <Link
            href="/billing"
            className={cn(
              "mt-2 inline-block text-[11px] font-semibold hover:underline",
              hud ? "text-brand-400" : "text-brand-600",
            )}
          >
            Upgrade plan →
          </Link>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-muted transition hover:bg-[#faf8fb] hover:text-ink"
        >
          <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

const SIDEBAR_KEY = "leadflow-sidebar-collapsed";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === "1") setSidebarCollapsed(true);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const hudMode = true;

  return (
    <div
      className={cn(
        "flex h-[100dvh] overflow-hidden bg-transparent",
        hudMode && "app-shell--hud",
      )}
    >
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {user.impersonating && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-[#1a1224] px-4 py-2 text-[12px] text-white">
          <span>
            Testing as{" "}
            <strong>{user.companyName || user.name || user.email}</strong>
          </span>
          <button
            type="button"
            className="rounded-lg bg-white px-2.5 py-1 font-semibold text-ink"
            onClick={async () => {
              await fetch("/api/admin/impersonate/exit", { method: "POST" });
              window.location.href = "/admin/customers";
            }}
          >
            Exit
          </button>
        </div>
      )}
      <aside
        className={cn(
          "hud-shell-aside hidden h-full shrink-0 flex-col border-r border-border/70 bg-white/90 shadow-[4px_0_24px_rgba(20,17,26,0.03)] backdrop-blur-xl transition-[width,opacity,transform] duration-300 ease-out lg:flex",
          sidebarCollapsed
            ? "w-0 overflow-hidden border-r-0 opacity-0 shadow-none"
            : "w-[268px] opacity-100",
          user.impersonating ? "pt-10" : "",
        )}
        aria-hidden={sidebarCollapsed}
      >
        <div className="flex h-full w-[268px] flex-col">
          <SidebarNav user={user} onCollapse={toggleSidebar} hud={hudMode} />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className={cn(
              "absolute inset-0 animate-fade-in backdrop-blur-[2px]",
              hudMode ? "bg-[var(--canvas)]/70" : "bg-[#0f0c14]/40",
            )}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              "hud-shell-aside animate-slide-left relative flex h-full w-[min(288px,86vw)] flex-col border-r shadow-2xl",
              hudMode
                ? "border-border bg-[var(--sidebar)]"
                : "border-border bg-[var(--sidebar)]",
            )}
          >
            <SidebarNav
              user={user}
              showClose
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
              hud={hudMode}
            />
          </aside>
        </div>
      )}

      <div
        className={cn(
          "hud-viewport-bg flex min-h-0 min-w-0 flex-1 flex-col",
          user.impersonating ? "pt-10" : "",
        )}
      >
        <TopHeader
          user={user}
          onMenuClick={() => setMobileOpen((v) => !v)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          hud={hudMode}
        />
        <main className="hud-shell-main scrollbar-thin min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="page-enter min-h-full">{children}</div>
        </main>
        <footer
          className={cn(
            "hud-shell-footer shrink-0 border-t border-border/70 bg-white/70 px-4 py-3 text-center text-[11px] text-ink-faint backdrop-blur-md sm:px-6 sm:text-[12px]",
          )}
        >
          Copyright © 2026 Contractor Leads. All rights reserved.
        </footer>
      </div>

      <SupportChatWidget user={user} />
    </div>
  );
}
