"use client";

import { useState } from "react";
import Link from "next/link";
import { HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/industries", label: "Industries" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/#faq", label: "FAQ" },
] as const;

/** Compact hamburger menu for marketing headers on < md. */
export function MarketingMobileNav({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("md:hidden", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
      >
        {open ? (
          <HiOutlineXMark className="h-5 w-5" />
        ) : (
          <HiOutlineBars3 className="h-5 w-5" />
        )}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-50 border-b border-slate-200/80 bg-white/95 px-5 py-4 shadow-lg backdrop-blur-xl sm:px-8">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1" aria-label="Mobile">
            {LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-semibold text-slate-700 transition hover:bg-fuchsia-50 hover:text-fuchsia-700"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 text-[14px] font-semibold text-slate-700"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 text-[14px] font-semibold text-white"
              >
                Start free
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
