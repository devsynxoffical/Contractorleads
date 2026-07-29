"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HiOutlineArrowPath, HiOutlineExclamationTriangle } from "react-icons/hi2";

/**
 * Shared fallback for route-segment error boundaries. Surfaces the digest so a
 * failure can be matched to server logs — server errors ship a generic message
 * to the client, so the digest is the only way to trace one.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "This section failed to load. Trying again usually clears it.",
  error,
  retry,
  homeHref = "/home",
  homeLabel = "Back to dashboard",
}: {
  title?: string;
  description?: string;
  error: Error & { digest?: string };
  retry?: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-surface p-7 text-center shadow-sm">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <HiOutlineExclamationTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">
          {title}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          {description}
        </p>

        {error.message ? (
          <p className="mt-4 break-words rounded-xl bg-canvas px-3 py-2 text-left text-[12px] leading-relaxed text-ink-faint">
            {error.message}
          </p>
        ) : null}
        {error.digest ? (
          <p className="mt-2 text-[11px] text-ink-faint">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {retry ? (
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-105"
            >
              <HiOutlineArrowPath className="h-4 w-4" />
              Try again
            </button>
          ) : null}
          <Link
            href={homeHref}
            className="inline-flex rounded-xl border border-border/80 bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-muted transition hover:text-ink"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
