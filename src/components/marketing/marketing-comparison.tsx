"use client";

import Link from "next/link";
import Image from "next/image";
import { HiOutlineArrowRight, HiOutlineCheck, HiOutlineScale } from "react-icons/hi2";
import { Reveal } from "./marketing-ui";

const ROWS: Array<{
  feature: string;
  detail: string;
  others: string | "check" | "dash";
  us: string | "check";
}> = [
  {
    feature: "Live business data",
    detail: "Every search hits Google Places at the moment you run it.",
    others: "Months-old lists",
    us: "Live at search time",
  },
  {
    feature: "Owner names",
    detail: "Read from the contractor's own website and cross-checked.",
    others: "Pattern-guessed emails",
    us: "Verified or left blank",
  },
  {
    feature: "Lead scoring",
    detail: "Website, SEO, PPC and marketing gaps, Hot / Warm / Nurture.",
    others: "Manual research",
    us: "Automatic, 0 to 100",
  },
  {
    feature: "Meta ad intelligence",
    detail: "Know who is already spending before you pitch.",
    others: "dash",
    us: "check",
  },
  {
    feature: "Outreach scripts",
    detail: "Cold email, SMS and call scripts written from each lead's audit.",
    others: "dash",
    us: "check",
  },
  {
    feature: "CRM and webhooks",
    detail: "GoHighLevel, HubSpot, Zapier, Make, Slack and CSV export.",
    others: "check",
    us: "check",
  },
];

function Cell({ value, strong }: { value: string | "check" | "dash"; strong?: boolean }) {
  if (value === "check") {
    return (
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${strong ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
        <HiOutlineCheck className="h-4 w-4" />
      </span>
    );
  }
  if (value === "dash") return <span className="text-white/35">—</span>;
  return <span className={strong ? "font-semibold text-white" : "text-white/55"}>{value}</span>;
}

/** Ametrix-style "the difference" panel: dark rounded block on a light band with a comparison table. */
export function MarketingComparison() {
  return (
    <section id="compare" className="relative bg-[#f6f4f9] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="relative mx-auto max-w-6xl">
        {/* Notch with logo */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f4f9] shadow-[0_0_0_10px_#f6f4f9]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 shadow-[0_0_40px_rgba(217,70,239,0.6)]">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
            </span>
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[32px] bg-[#0b0712] px-5 pb-14 pt-16 text-white sm:px-10 sm:pb-16 sm:pt-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(217,70,239,0.35), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(124,58,237,0.25), transparent 60%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 72px)",
              maskImage: "linear-gradient(180deg, black, transparent 70%)",
            }}
            aria-hidden
          />

          <Reveal className="relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/80">
              <HiOutlineScale className="h-3.5 w-3.5" />
              The difference
            </span>
            <h2 className="mt-5 font-[family-name:var(--font-serif)] text-[clamp(2.2rem,4.8vw,3.5rem)] font-normal leading-[1.05] tracking-[-0.01em]">
              How Contractor Leads simplifies what others complicate daily
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
              Live data, verified owners and scored gaps replace the research morning, so your team spends
              the day selling.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="relative mx-auto mt-10 max-w-4xl">
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
              <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
                <caption className="sr-only">Contractor Leads compared with typical lead lists and scrapers</caption>
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="px-5 py-4 text-[14px] font-semibold text-white">Features</th>
                    <th scope="col" className="border-l border-white/10 px-5 py-4 text-center text-[14px] font-medium text-white/70">Others</th>
                    <th scope="col" className="border-l border-white/10 bg-gradient-to-b from-fuchsia-500/15 to-transparent px-5 py-4 text-center text-[14px] font-semibold text-white">
                      <span className="inline-flex items-center gap-2">
                        <Image src="/logo.png" alt="" width={18} height={18} className="rounded-full" />
                        Contractor Leads
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.feature} className="border-b border-white/10 last:border-0">
                      <th scope="row" className="px-5 py-4 align-top font-normal">
                        <span className="block text-[14px] font-semibold text-white">{r.feature}</span>
                        <span className="mt-0.5 block text-[12.5px] text-white/50">{r.detail}</span>
                      </th>
                      <td className="border-l border-white/10 px-5 py-4 text-center align-middle">
                        <Cell value={r.others} />
                      </td>
                      <td className="border-l border-white/10 bg-fuchsia-500/[0.06] px-5 py-4 text-center align-middle">
                        <Cell value={r.us} strong />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-[14px] font-semibold text-white shadow-[0_0_40px_rgba(217,70,239,0.55)] transition hover:shadow-[0_0_56px_rgba(217,70,239,0.8)]"
            >
              Start free trial
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/alternatives"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/[0.06] px-6 text-[14px] font-semibold text-white transition hover:bg-white/10"
            >
              Compare tools
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
