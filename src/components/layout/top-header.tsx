"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import type { SessionUser } from "@/lib/session-user";
import { cn, formatCredits } from "@/lib/utils";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const LOGO_GRADIENT = "var(--logo-gradient)";

export function TopHeader({
  user,
  onMenuClick,
  sidebarCollapsed,
  onToggleSidebar,
  hud = false,
}: {
  user: SessionUser;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  hud?: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "hud-shell-header sticky top-0 z-30 border-b backdrop-blur-xl",
        hud
          ? "border-border bg-[color-mix(in_srgb,var(--hud-bg)_90%,transparent)] shadow-none"
          : "border-border/70 bg-surface/80 shadow-[var(--shadow-soft)]"
      )}
    >
      <div className="flex h-[56px] items-center gap-2 px-3 sm:h-[64px] sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-brand-50 hover:text-brand-500 lg:hidden"
          aria-label="Open menu"
        >
          <HiOutlineBars3 className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-ink-muted transition hover:border-border hover:bg-brand-50 hover:text-brand-500 lg:flex"
          aria-label={sidebarCollapsed ? "Show side menu" : "Hide side menu"}
          title={sidebarCollapsed ? "Show side menu" : "Hide side menu"}
        >
          {sidebarCollapsed ? (
            <HiOutlineChevronDoubleRight className="h-5 w-5" />
          ) : (
            <HiOutlineChevronDoubleLeft className="h-5 w-5" />
          )}
        </button>

        <div className="hidden min-w-0 flex-1 items-center sm:flex">
          <GlobalSearch className="w-full max-w-md" />
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-brand-50 hover:text-brand-500 sm:hidden"
          aria-label="Search"
        >
          <HiOutlineMagnifyingGlass className="h-5 w-5" />
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle compact />

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-ink-muted transition hover:border-border hover:bg-brand-50 hover:text-brand-500"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-5 w-5" />
            <span
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm"
              style={{ background: LOGO_GRADIENT }}
            >
              4
            </span>
          </button>

          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-1.5 transition hover:border-border hover:bg-brand-50 sm:pr-2.5"
          >
            <div
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-brand-500/35"
              style={{ background: LOGO_GRADIENT }}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 max-w-[130px] md:block">
              <p className="truncate text-[12px] font-semibold tracking-tight text-ink">
                {user.name || "User"}
              </p>
              <p className="truncate text-[10px] font-medium text-ink-faint">
                {formatCredits(user.creditsRemaining)} credits
              </p>
            </div>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border px-3 py-2 sm:hidden">
          <GlobalSearch />
        </div>
      )}
    </header>
  );
}
