import Link from "next/link";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import {
  HiOutlineArrowRight,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineBuildingStorefront,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";

export default function NotFound() {
  return (
    <MarketingSiteShell>
      <section className="relative overflow-hidden bg-[#07040f] py-24 sm:py-32 text-center text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(168,85,247,0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
          <p className="font-[family-name:var(--font-display)] text-[72px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400">
            404
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-white">
            Page not found
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/70">
            The page you are looking for has been moved or doesn’t exist. Check out our main resources below:
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 text-left">
            <Link
              href="/features"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/10 hover:border-fuchsia-400/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
                <HiOutlineSparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">Features</p>
                <p className="text-[12px] text-white/60">Lead Finder, scoring & enrichment</p>
              </div>
            </Link>

            <Link
              href="/pricing"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/10 hover:border-fuchsia-400/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                <HiOutlineTag className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">Pricing & Plans</p>
                <p className="text-[12px] text-white/60">Starter $19.99, Growth $49, Agency $99</p>
              </div>
            </Link>

            <Link
              href="/industries"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/10 hover:border-fuchsia-400/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300">
                <HiOutlineBuildingStorefront className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">Industries</p>
                <p className="text-[12px] text-white/60">18 home-service trades & market data</p>
              </div>
            </Link>

            <Link
              href="/help"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/10 hover:border-fuchsia-400/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                <HiOutlineQuestionMarkCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">Help Center</p>
                <p className="text-[12px] text-white/60">Setup guides, credits & FAQs</p>
              </div>
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
            >
              <HiOutlineHome className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </MarketingSiteShell>
  );
}
