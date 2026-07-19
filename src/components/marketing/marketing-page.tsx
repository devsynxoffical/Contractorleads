"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import dynamic from "next/dynamic";
import {
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineMap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

const MarketingHero3D = dynamic(
  () =>
    import("./marketing-hero-3d").then((m) => m.MarketingHero3D),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-[var(--canvas)]" /> },
);

const TRIP_STEPS = [
  {
    kicker: "01 — Discover",
    title: "Pull live contractor leads from any Tier‑1 market.",
    body: "Search by trade, city, or custom area. Google Places feeds real businesses — not scraped junk lists.",
    icon: HiOutlineMap,
  },
  {
    kicker: "02 — Qualify",
    title: "AI scores revenue, opportunity, and outreach angle.",
    body: "Hot / Warm / Nurture tiers, website quality, PPC & SEO upside — so your SDRs know who to call first.",
    icon: HiOutlineSparkles,
  },
  {
    kicker: "03 — Reach",
    title: "Scripts, ads intel, and owner contacts in one workspace.",
    body: "Ask Expert chat, LinkedIn + social enrichment, and Meta Ads Library checks without leaving the lead.",
    icon: HiOutlineChatBubbleLeftRight,
  },
];

const FEATURES = [
  {
    title: "Lead Finder",
    copy: "Industry + location filters with social + owner requirements baked in.",
  },
  {
    title: "World map HUD",
    copy: "See where your pipeline lives — country density and hot clusters at a glance.",
  },
  {
    title: "AI Assistant",
    copy: "Multi-turn chat with history. Offers, hooks, and scripts that match your agency profile.",
  },
  {
    title: "Credit-smart billing",
    copy: "Pay for searches and AI when you use them — start with trial credits, no card required.",
  },
];

function MarketingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            <Image src="/logo.png" alt="" width={40} height={40} className="object-cover" priority />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight text-ink">
            Contractor{" "}
            <span className="gradient-text">Leads</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-3 py-2 text-[13px] font-medium text-ink-muted transition hover:text-ink sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)] transition hover:opacity-95"
            style={{ background: LOGO_GRADIENT }}
          >
            Start free
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-28 sm:justify-center sm:pb-24 sm:pt-24">
      <MarketingHero3D />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="mb-4 font-[family-name:var(--font-display)] text-[13px] font-semibold uppercase tracking-[0.22em] text-brand-400">
            Contractor Leads
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-ink">
            The need for leads —{" "}
            <span className="gradient-text">scored and ready</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
            Find verified home-service contractors, qualify them with AI, and
            outreach from one interactive workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_12px_40px_rgba(236,72,153,0.35)] transition hover:opacity-95"
              style={{ background: LOGO_GRADIENT }}
            >
              Get 20 free credits
              <HiOutlineBolt className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-[var(--surface)] px-5 py-3.5 text-[14px] font-semibold text-ink transition hover:border-brand-500/40"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
      <motion.div
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-faint"
        animate={{ opacity: [0.35, 1, 0.35], y: [0, 4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        Scroll
      </motion.div>
    </section>
  );
}

function ScrollTrip() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["8%", "100%"]);

  return (
    <section ref={ref} className="relative h-[280vh] bg-[var(--canvas-deep)]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-400">
            How it trips
          </p>
          <h2 className="max-w-lg font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-tight text-ink">
            One pipeline. Three beats.
          </h2>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-brand-50">
            <motion.div
              className="h-full rounded-full"
              style={{ width: progressWidth, background: LOGO_GRADIENT }}
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {TRIP_STEPS.map((step, i) => {
              const start = i / TRIP_STEPS.length;
              const end = (i + 1) / TRIP_STEPS.length;
              return (
                <TripCard
                  key={step.kicker}
                  step={step}
                  progress={scrollYProgress}
                  range={[start, end]}
                  index={i}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TripCard({
  step,
  progress,
  range,
  index,
}: {
  step: (typeof TRIP_STEPS)[number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
  index: number;
}) {
  const opacity = useTransform(
    progress,
    [range[0], range[0] + 0.08, range[1] - 0.05, range[1]],
    [0.25, 1, 1, 0.45],
  );
  const y = useTransform(
    progress,
    [range[0], range[0] + 0.1],
    [48 + index * 12, 0],
  );
  const scale = useTransform(
    progress,
    [range[0], range[0] + 0.1, range[1]],
    [0.94, 1, 0.98],
  );
  const Icon = step.icon;

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="relative overflow-hidden rounded-3xl border border-border bg-[var(--panel-solid)] p-6 shadow-[var(--shadow-card)]"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-3xl"
        style={{ background: LOGO_GRADIENT }}
      />
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-400">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
        {step.kicker}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[20px] font-semibold leading-snug tracking-tight text-ink">
        {step.title}
      </h3>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">{step.body}</p>
    </motion.div>
  );
}

function FeatureStrip() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(var(--hud-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hud-grid) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-xl"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-400">
            Built for agencies
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-tight text-ink">
            Interactive workspace — not another CSV dump.
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 36, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.65,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-[var(--surface)] p-7"
              style={{ transformPerspective: 900 }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px opacity-0 transition group-hover:opacity-100"
                style={{ background: LOGO_GRADIENT }}
              />
              <h3 className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                {f.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParallaxCta() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.35, 0.7], [0, 1, 1]);

  return (
    <section ref={ref} className="relative overflow-hidden py-28 sm:py-36">
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[100px]"
        aria-hidden
      >
        <div className="h-full w-full" style={{ background: LOGO_GRADIENT }} />
      </motion.div>
      <motion.div
        style={{ opacity }}
        className="relative mx-auto max-w-3xl px-5 text-center sm:px-8"
      >
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-tight text-ink">
          Ready to fill the calendar?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] text-ink-muted">
          Spin up your workspace, run a search, and let AI tell you who&apos;s
          worth the call.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-[15px] font-semibold text-white shadow-[0_16px_48px_rgba(168,85,247,0.4)]"
          style={{ background: LOGO_GRADIENT }}
        >
          Start free trial
          <HiOutlineArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
          <span className="text-[13px] font-medium text-ink-muted">
            Contractor Leads
          </span>
        </div>
        <p className="text-[12px] text-ink-faint">
          © {new Date().getFullYear()} Contractor Leads. All rights reserved.
        </p>
        <div className="flex gap-4 text-[12px] font-medium text-ink-muted">
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-ink">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function MarketingPage() {
  return (
    <div className="marketing-site min-h-screen bg-[var(--canvas)] text-ink">
      <MarketingNav />
      <Hero />
      <ScrollTrip />
      <FeatureStrip />
      <ParallaxCta />
      <MarketingFooter />
    </div>
  );
}
