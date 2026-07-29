"use client";

import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  href?: string;
};

/** Consistent back control used across app detail + section pages. */
export function BackLink({
  href,
  label = "Back",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 font-[family-name:var(--font-jakarta)] text-[13px] font-medium text-ink-muted transition hover:text-brand-700",
        className,
      )}
    >
      <HiOutlineArrowLeft className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

/** Compact trail: Home / Leads / Detail */
export function PageCrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 font-[family-name:var(--font-jakarta)] text-[12px] text-ink-faint",
        className,
      )}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && (
              <HiOutlineChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint/70" />
            )}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="font-medium text-ink-muted transition hover:text-brand-700"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  last ? "font-semibold text-ink" : "font-medium text-ink-muted",
                )}
                aria-current={last ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
