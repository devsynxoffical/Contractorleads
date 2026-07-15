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
import type { SessionUser } from "@/lib/auth";
import { formatCredits } from "@/lib/utils";

const LOGO_GRADIENT =
  "linear-gradient(135deg, #e6007e 0%, #8e24aa 55%, #7b1fa2 100%)";

export function TopHeader({
  user,
  onMenuClick,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  user: SessionUser;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/75 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-xl">
      <div className="flex h-[56px] items-center gap-2 px-3 sm:h-[64px] sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-brand-50 hover:text-brand-600 lg:hidden"
          aria-label="Open menu"
        >
          <HiOutlineBars3 className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-ink-muted transition hover:border-border hover:bg-white hover:text-brand-600 hover:shadow-[var(--shadow-soft)] lg:flex"
          aria-label={sidebarCollapsed ? "Show side menu" : "Hide side menu"}
          title={sidebarCollapsed ? "Show side menu" : "Hide side menu"}
        >
          {sidebarCollapsed ? (
            <HiOutlineChevronDoubleRight className="h-5 w-5" />
          ) : (
            <HiOutlineChevronDoubleLeft className="h-5 w-5" />
          )}
        </button>

        <form
          className="hidden min-w-0 flex-1 items-center sm:flex"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="relative w-full max-w-md">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, industries, cities…"
              className="h-10 w-full rounded-xl border border-border/80 bg-[#faf8fc]/90 pl-10 pr-3 text-[13px] text-ink outline-none transition placeholder:text-ink-faint hover:bg-white focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-[var(--ring)]"
            />
          </div>
        </form>

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-brand-50 hover:text-brand-600 sm:hidden"
          aria-label="Search"
        >
          <HiOutlineMagnifyingGlass className="h-5 w-5" />
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-ink-muted transition hover:border-border hover:bg-white hover:text-brand-600 hover:shadow-[var(--shadow-soft)]"
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
            className="flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-1.5 transition hover:border-border hover:bg-white hover:shadow-[var(--shadow-soft)] sm:pr-2.5"
          >
            <div
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-white"
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
        <div className="border-t border-border/70 px-3 py-2 sm:hidden">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads…"
              autoFocus
              className="h-10 w-full rounded-xl border border-border bg-[#faf8fc] pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-400 focus:bg-white"
            />
          </div>
        </div>
      )}
    </header>
  );
}
