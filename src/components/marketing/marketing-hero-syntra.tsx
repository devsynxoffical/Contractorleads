"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineFire,
  HiOutlineGlobeAmericas,
  HiOutlineMagnifyingGlass,
  HiOutlineMegaphone,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { handleMarketingHashClick } from "./marketing-scroll";
import { usePrefersReducedMotion } from "./marketing-motion";
import { MarketingAuthActions, useMarketingSession } from "./marketing-auth-actions";
import { MarketingMobileNav } from "./marketing-mobile-nav";
import { HeroObject } from "./hero-object";


const NAV = [
  { href: "/features", label: "Features" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Help" },
];

const STEPS = [
  { label: "Search", icon: HiOutlineMagnifyingGlass },
  { label: "Score", icon: HiOutlineSparkles },
  { label: "Outreach", icon: HiOutlinePaperAirplane },
  { label: "Signed", icon: HiOutlineCheck },
];

const STATS = [
  { icon: HiOutlineChartBar, value: `${INDUSTRIES.length}`, label: "Home-service trades" },
  { icon: HiOutlineGlobeAmericas, value: `${TIER_ONE_COUNTRIES.length}`, label: "Countries covered" },
  { icon: HiOutlineFire, value: "10", label: "Free scored leads" },
];

const CAPABILITIES = [
  {
    icon: HiOutlineSparkles,
    title: "Score every lead",
    body: "Website, SEO, PPC and marketing gaps, 0 to 100.",
  },
  {
    icon: HiOutlineUserCircle,
    title: "Reach the owner",
    body: "Names read from the business site, never guessed.",
  },
  {
    icon: HiOutlineMegaphone,
    title: "Know their ads",
    body: "Meta Ads Library status before you pitch.",
  },
];

/** Illustrative feed items; labelled as sample data in the UI. */
const ACTIVITY = [
  { who: "Lead Finder", what: "42 roofers scored in Austin, TX", tag: "Hot: 14", tone: "rose" },
  { who: "Owner enrichment", what: "Owner found for Summit Peak Roofing", tag: "Verified", tone: "violet" },
  { who: "Meta Ads Intel", what: "3 HVAC shops running ads in Tampa", tag: "Active", tone: "sky" },
  { who: "Outreach Studio", what: "Cold email drafted from site audit", tag: "Ready", tone: "emerald" },
  { who: "Pipeline", what: "Lone Star Plumbing moved to Meeting", tag: "Stage", tone: "amber" },
  { who: "Lead Finder", what: "28 plumbers scored in Denver, CO", tag: "Hot: 9", tone: "rose" },
];

const AVATAR: Record<string, string> = {
  rose: "linear-gradient(135deg,#f43f5e,#ec4899)",
  violet: "linear-gradient(135deg,#8b5cf6,#d946ef)",
  sky: "linear-gradient(135deg,#0ea5e9,#6366f1)",
  emerald: "linear-gradient(135deg,#10b981,#14b8a6)",
  amber: "linear-gradient(135deg,#f59e0b,#f97316)",
};

const TONE: Record<string, string> = {
  rose: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  violet: "bg-violet-500/15 text-violet-200 border-violet-400/30",
  sky: "bg-sky-500/15 text-sky-200 border-sky-400/30",
  emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  amber: "bg-amber-500/15 text-amber-200 border-amber-400/30",
};

function HeroPrimaryCta() {
  const authed = useMarketingSession();
  return (
    <Link
      href={authed ? "/home" : "/register"}
      className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-[14px] font-semibold text-white shadow-[0_12px_40px_-10px_rgba(217,70,239,0.75)] transition hover:shadow-[0_16px_50px_-10px_rgba(217,70,239,0.95)]"
    >
      {authed ? "Go to dashboard" : "Get started free"}
      <HiOutlineArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function Card({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-[20px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between text-[14px] font-semibold text-white"
    >
      {title}
      <HiOutlineArrowRight className="h-4 w-4 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  );
}

function PipelineCard({ reduced }: { reduced: boolean }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1800);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <Card delay={0.55}>
      <CardHeader title="From search to signed retainer" href="/features" />
      <div className="relative mt-5">
        <div className="absolute left-5 right-5 top-5 h-px bg-white/10" aria-hidden />
        <motion.div
          className="absolute left-5 top-5 h-px bg-gradient-to-r from-fuchsia-400 to-emerald-400"
          animate={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ maxWidth: "calc(100% - 2.5rem)" }}
          aria-hidden
        />
        <ol className="relative grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const on = i <= active;
            return (
              <li key={s.label} className="flex flex-col items-center text-center">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-500 ${
                    on
                      ? i === STEPS.length - 1
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                        : "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100"
                      : "border-white/15 bg-white/[0.04] text-white/50"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="mt-2 text-[11.5px] font-medium text-white/75">{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

function ActivityCard({ reduced }: { reduced: boolean }) {
  const [cursor, setCursor] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setCursor((c) => c + 1), 3200);
    return () => window.clearInterval(t);
  }, [reduced]);
  const n = ACTIVITY.length;
  const items = [0, 1, 2].map((i) => {
    const idx = (((cursor - i) % n) + n) % n;
    return { ...ACTIVITY[idx], key: cursor - i };
  });

  return (
    <Card delay={0.75}>
      <CardHeader title="Workspace activity" href="/features" />
      <ul className="mt-4 space-y-3">
        {items.map((it, i) => (
          <motion.li
            key={it.key}
            initial={i === 0 ? { opacity: 0, y: -10 } : false}
            animate={{ opacity: 1 - i * 0.18, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-start gap-3"
          >
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: AVATAR[it.tone] }}
              aria-hidden
            >
              {it.who.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">{it.who}</span>
              <span className="block truncate text-[12px] text-white/60">{it.what}</span>
            </span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${TONE[it.tone]}`}>
              {it.tag}
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-4 text-[10.5px] uppercase tracking-wider text-white/35">Sample workspace</p>
    </Card>
  );
}

export function MarketingHeroSyntra() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden bg-[#07040f] text-white"
      aria-label="Hero"
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 58% 42%, rgba(168,85,247,0.28), transparent 60%), radial-gradient(ellipse 35% 35% at 12% 15%, rgba(236,72,153,0.16), transparent 60%), radial-gradient(ellipse 30% 30% at 92% 85%, rgba(56,189,248,0.14), transparent 60%)",
        }}
        aria-hidden
      />
      {/* Constellation dots */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 18% 28%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 64% 12%, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 82% 38%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 38% 78%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 74% 86%, rgba(255,255,255,0.7), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-white/[0.05]"
        aria-hidden
      />

      {/* Nav */}
      <header className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={34} height={34} className="rounded-full" priority />
          <span className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight">
            Contractor <span className="gradient-text">Leads</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-white/70 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <MarketingAuthActions variant="dark" />
          <MarketingMobileNav />
        </div>
      </header>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-6 sm:px-8 sm:pt-8 lg:grid-cols-12 lg:gap-5 lg:pb-12">
        {/* Left column */}
        <div className="lg:col-span-5">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.26em] text-fuchsia-300/90"
          >
            Contractor lead intelligence
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 max-w-[15ch] font-[family-name:var(--font-serif)] text-[clamp(2.5rem,4.3vw,3.75rem)] font-normal leading-[1.0] tracking-[-0.02em] text-white"
          >
            Contractor leads for agencies, <em className="not-italic bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">scored and ready to dial.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65"
          >
            Live Google data, AI lead scores, owner names and outreach scripts for agencies that sell
            to roofers, HVAC, plumbers and {INDUSTRIES.length - 3} more trades.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="mt-6 flex flex-wrap items-center gap-4"
          >
            <HeroPrimaryCta />
            <a
              href="#interactive-demo"
              onClick={(e) => handleMarketingHashClick(e, "#interactive-demo")}
              className="group inline-flex items-center gap-2.5 text-[14px] font-semibold text-white/85 transition hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.05] transition group-hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              See how it works
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-[12px] text-white/45"
          >
            10 free leads · No card required · Cancel anytime
          </motion.p>

          <div className="mt-8 space-y-3">
            <PipelineCard reduced={reduced} />
            <Card delay={0.65}>
              <CardHeader title="Built for real outreach desks" href="/pricing" />
              <dl className="mt-4 grid grid-cols-3 divide-x divide-white/10">
                {STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-start gap-2.5 px-3 first:pl-0 last:pr-0">
                      <Icon className="mt-1 h-4.5 w-4.5 shrink-0 text-fuchsia-300" />
                      <div>
                        <dt className="sr-only">{s.label}</dt>
                        <dd className="font-[family-name:var(--font-display)] text-[20px] font-semibold leading-none text-white">
                          {s.value}
                        </dd>
                        <dd className="mt-1 text-[11px] leading-snug text-white/55">{s.label}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Card>
          </div>
        </div>

        {/* Center: 3D knot */}
        <div className="relative order-first lg:order-none lg:col-span-4">
          <div className="relative mx-auto w-full max-w-[440px] lg:-mx-10 lg:-mt-4 lg:w-[calc(100%+5rem)] lg:max-w-none">
            <HeroObject />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3 lg:col-span-3 lg:pt-2">
          <Card delay={0.45} className="lg:relative lg:z-10">
            <CardHeader title="Clearer prospecting" href="/features" />
            <ul className="mt-4 divide-y divide-white/10">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-fuchsia-200">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-semibold text-white">{c.title}</span>
                      <span className="block text-[12.5px] leading-relaxed text-white/60">{c.body}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <ActivityCard reduced={reduced} />
        </div>
      </div>
    </section>
  );
}
