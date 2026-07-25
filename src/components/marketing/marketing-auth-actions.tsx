"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type Variant = "hero" | "scroll" | "chrome" | "pills";

function useMarketingSession() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => {
        if (!cancelled) setLoggedIn(r.ok);
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return loggedIn === true;
}

/** Primary hero button under the headline. */
export function MarketingHeroPrimaryCta() {
  const isAuthed = useMarketingSession();
  if (isAuthed) {
    return (
      <Link href="/dashboard" className="mkt-flow-pill mkt-flow-pill--primary">
        Go to Dashboard
        <HiOutlineArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  }
  return (
    <Link href="/register" className="mkt-flow-pill mkt-flow-pill--primary">
      Start closing leads free
      <HiOutlineArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

/**
 * Marketing header CTAs: Sign in + Get started when logged out,
 * Dashboard when logged in.
 */
export function MarketingAuthActions({
  variant = "chrome",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const isAuthed = useMarketingSession();

  if (variant === "hero" || variant === "pills") {
    if (isAuthed) {
      return (
        <div className={cn("mkt-flow-nav-actions", className)}>
          <Link href="/dashboard" className="mkt-flow-pill mkt-flow-pill--primary">
            Dashboard
          </Link>
        </div>
      );
    }
    return (
      <div className={cn("mkt-flow-nav-actions", className)}>
        <Link href="/login" className="mkt-flow-pill mkt-flow-pill--login">
          Log in
        </Link>
        <Link href="/register" className="mkt-flow-pill">
          Get started free
        </Link>
      </div>
    );
  }

  if (variant === "scroll") {
    if (isAuthed) {
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
            style={{
              background:
                "linear-gradient(135deg,#db2777 0%,#c026d3 45%,#9333ea 75%,#7c3aed 100%)",
            }}
          >
            Dashboard <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      );
    }
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link
          href="/login"
          className="hidden rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:text-slate-900 sm:inline"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
          style={{
            background:
              "linear-gradient(135deg,#db2777 0%,#c026d3 45%,#9333ea 75%,#7c3aed 100%)",
          }}
        >
          Get started free <HiOutlineArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (isAuthed) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link
          href="/dashboard"
          className="rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link
        href="/login"
        className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm"
      >
        Start free
      </Link>
    </div>
  );
}
