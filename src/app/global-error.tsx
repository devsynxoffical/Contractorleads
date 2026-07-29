"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Replaces the root layout when it fails, so it must ship its own html/body and
 * styles. Kept dependency-free — anything it imports could be the thing broken.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-[#faf8fc] antialiased">
        <title>Something went wrong — Contractor Leads</title>
        <div className="flex min-h-screen items-center justify-center px-5 py-16">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              The page failed to load. Trying again usually clears it.
            </p>
            {error.digest ? (
              <p className="mt-4 text-[11px] text-slate-400">
                Reference: <code className="font-mono">{error.digest}</code>
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="inline-flex rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:text-slate-900"
              >
                Go to homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
