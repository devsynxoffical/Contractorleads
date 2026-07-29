import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — Contractor Leads",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="marketing-site flex min-h-screen items-center justify-center bg-[#faf8fc] px-5 py-16 text-slate-900">
      <div className="w-full max-w-lg rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
        <p className="font-[family-name:var(--font-display)] text-[42px] font-bold leading-none text-fuchsia-200">
          404
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-slate-900">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          The link may be out of date, or the page may have moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-95"
          >
            Go to homepage
          </Link>
          <Link
            href="/features"
            className="inline-flex rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:text-slate-900"
          >
            Browse features
          </Link>
        </div>
      </div>
    </div>
  );
}
