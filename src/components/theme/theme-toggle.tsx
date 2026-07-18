"use client";

import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface text-ink-muted transition hover:border-brand-500/40 hover:text-brand-500",
        compact ? "h-9 w-9" : "h-9 px-3 text-[12px] font-semibold",
        className
      )}
    >
      {isDark ? (
        <HiOutlineSun className="h-4 w-4 text-brand-400" />
      ) : (
        <HiOutlineMoon className="h-4 w-4 text-brand-600" />
      )}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
