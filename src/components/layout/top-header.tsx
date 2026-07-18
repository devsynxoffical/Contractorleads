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

const LOGO_GRADIENT =
  "linear-gradient(135deg, #00e5ff 0%, #00b8d4 55%, #0097a7 100%)";
const HUD_ACCENT = "linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)";

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
          ? "border-[#00e5ff]/15 bg-[#0b1220]/90 shadow-none"
          : "border-border/70 bg-white/75 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]",
      )}
    >
      <div className="flex h-[56px] items-center gap-2 px-3 sm:h-[64px] sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition lg:hidden",
            hud
              ? "text-[#8b9aab] hover:bg-[#00e5ff]/10 hover:text-[#00e5ff]"
              : "text-ink-muted hover:bg-brand-50 hover:text-brand-600",
          )}
          aria-label="Open menu"
        >
          <HiOutlineBars3 className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className={cn(
            "hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent transition lg:flex",
            hud
              ? "text-[#8b9aab] hover:border-[#00e5ff]/30 hover:bg-[#00e5ff]/10 hover:text-[#00e5ff]"
              : "text-ink-muted hover:border-border hover:bg-white hover:text-brand-600 hover:shadow-[var(--shadow-soft)]",
          )}
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
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition sm:hidden",
            hud
              ? "text-[#8b9aab] hover:bg-[#00e5ff]/10 hover:text-[#00e5ff]"
              : "text-ink-muted hover:bg-brand-50 hover:text-brand-600",
          )}
          aria-label="Search"
        >
          <HiOutlineMagnifyingGlass className="h-5 w-5" />
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent transition",
              hud
                ? "text-[#8b9aab] hover:border-[#00e5ff]/30 hover:bg-[#00e5ff]/10 hover:text-[#00e5ff]"
                : "text-ink-muted hover:border-border hover:bg-white hover:text-brand-600 hover:shadow-[var(--shadow-soft)]",
            )}
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-5 w-5" />
            <span
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm"
              style={{ background: hud ? HUD_ACCENT : LOGO_GRADIENT }}
            >
              4
            </span>
          </button>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-1.5 transition sm:pr-2.5",
              hud
                ? "hover:border-[#00e5ff]/30 hover:bg-[#00e5ff]/10"
                : "hover:border-border hover:bg-white hover:shadow-[var(--shadow-soft)]",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm",
                hud ? "ring-2 ring-[#00e5ff]/40" : "ring-2 ring-white",
              )}
              style={{ background: hud ? HUD_ACCENT : LOGO_GRADIENT }}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 max-w-[130px] md:block">
              <p
                className={cn(
                  "truncate text-[12px] font-semibold tracking-tight",
                  hud ? "text-white" : "text-ink",
                )}
              >
                {user.name || "User"}
              </p>
              <p
                className={cn(
                  "truncate text-[10px] font-medium",
                  hud ? "text-[#8b9aab]" : "text-ink-faint",
                )}
              >
                {formatCredits(user.creditsRemaining)} credits
              </p>
            </div>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div
          className={cn(
            "border-t px-3 py-2 sm:hidden",
            hud ? "border-[#00e5ff]/15" : "border-border/70",
          )}
        >
          <GlobalSearch />
        </div>
      )}
    </header>
  );
}
