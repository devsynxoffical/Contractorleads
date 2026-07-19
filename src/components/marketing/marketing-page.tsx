"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  HiOutlineArrowRight,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineMap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineMegaphone,
  HiOutlineDocumentText,
  HiOutlineBell,
  HiOutlineGlobeAlt,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlinePhoneXMark,
  HiOutlineCurrencyDollar,
  HiOutlineLink,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlinePlay,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { FloatingDashboard } from "./marketing-dashboard";
import {
  CloudDecor,
  SparklesDecor,
  SoftBlob,
  ContentPhoto,
  MARKETING_PHOTOS,
} from "./marketing-decor";
import {
  Reveal,
  TiltCard,
  AnimatedNumber,
  InfiniteMarquee,
  Glass,
  GradientBorder,
  SectionEyebrow,
  SectionTitle,
  AuroraBlob,
  SpotlightCursor,
  useMouseParallax,
} from "./marketing-ui";

const MarketingHero3D = dynamic(
  () => import("./marketing-hero-3d").then((m) => m.MarketingHero3D),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[var(--canvas)]" />,
  },
);

const LOGOS = [
  "Summit Agency",
  "Northstar Media",
  "Blueprint Ads",
  "Harbor Growth",
  "Pulse Local",
  "Vertex Digital",
  "Atlas Home Pros",
  "Canyon Creative",
];

const FEATURES = [
  { icon: HiOutlineSparkles, title: "AI Lead Scoring", copy: "Hot / Warm / Nurture with revenue bands and outreach angles." },
  { icon: HiOutlineMap, title: "Lead Finder", copy: "Live Places search across Tier‑1 markets and custom areas." },
  { icon: HiOutlineGlobeAlt, title: "World Map HUD", copy: "See pipeline density by country and metro in one view." },
  { icon: HiOutlineChatBubbleLeftRight, title: "AI Assistant", copy: "Multi-turn chat with history for offers, hooks, and scripts." },
  { icon: HiOutlineUserGroup, title: "Owner Enrichment", copy: "Website people scrape + LinkedIn company/owner resolve." },
  { icon: HiOutlineMegaphone, title: "Meta Ads Intel", copy: "Ads Library checks so you know who already spends on Meta." },
  { icon: HiOutlineDocumentText, title: "Outreach Studio", copy: "Email, SMS, and call scripts saved to your library." },
  { icon: HiOutlineChartBar, title: "Opportunity Scores", copy: "Website, PPC, SEO, and marketing upside scored 0–100." },
  { icon: HiOutlineBell, title: "Live Activity", copy: "Search results and AI replies stream as they happen." },
  { icon: HiOutlineCpuChip, title: "Business Context", copy: "Answers adapt to your agency profile and ICP." },
  { icon: HiOutlineLink, title: "Social Presence Filter", copy: "Require LinkedIn + social + owner before a lead lands." },
  { icon: HiOutlineShieldCheck, title: "Verified Sources", copy: "Google, Yelp, and site data — never invented phones." },
];

const PAINS = [
  { icon: HiOutlineCurrencyDollar, title: "Buying fake leads", body: "Purchased lists go stale before your first dial." },
  { icon: HiOutlineChartBar, title: "Low conversion", body: "No scoring means SDRs burn time on nurture junk." },
  { icon: HiOutlineClock, title: "Manual follow-up", body: "Tabs, sheets, and notes never stay in sync." },
  { icon: HiOutlinePhoneXMark, title: "Slow response", body: "Competitors reply while you’re still enriching." },
  { icon: HiOutlineLink, title: "Disconnected tools", body: "Maps, ads, CRM, and AI live in five different apps." },
  { icon: HiOutlineMegaphone, title: "Blind ad spend", body: "You pitch PPC without knowing if they already run Meta." },
];

const WORKFLOW = [
  "Lead discovered",
  "AI qualifies",
  "Owner enriched",
  "Ads checked",
  "Script generated",
  "Outreach sent",
  "Job booked",
];

const INTEGRATIONS = [
  "Google Places",
  "OpenAI",
  "Meta Ads",
  "Yelp",
  "LinkedIn",
  "Stripe",
  "Resend",
  "Zapier",
  "Slack",
  "HubSpot",
  "Twilio",
  "Calendar",
];

const FAQS = [
  {
    q: "Is this for agencies or contractors?",
    a: "Contractor Leads is built for marketing agencies that sell lead-gen and paid media to home-service contractors.",
  },
  {
    q: "Are the leads real?",
    a: "Yes. Searches run against Google Places and enrich from websites, Yelp, and optional LinkedIn/Meta sources. We don’t invent phone numbers.",
  },
  {
    q: "How do credits work?",
    a: "Lead searches and AI messages consume credits. New accounts start with trial credits — no card required to explore.",
  },
  {
    q: "Can I filter for LinkedIn + social?",
    a: "Yes. Lead Finder can require LinkedIn, at least one social profile, and a website owner name before a business is returned.",
  },
  {
    q: "Does AI qualification need OpenAI?",
    a: "For live revenue estimates and opportunity scores, yes. Without a valid OpenAI key the app falls back to rule-based heuristics.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 49,
    blurb: "For solo closers testing a new niche.",
    features: ["Trial credits included", "Lead Finder", "AI Assistant", "Saved leads"],
  },
  {
    name: "Pro",
    price: 99,
    blurb: "For agencies running weekly lead sprints.",
    popular: true,
    features: [
      "Higher credit pool",
      "Map + enrichment",
      "Outreach Studio",
      "Priority AI",
    ],
  },
  {
    name: "Agency",
    price: 0,
    custom: true,
    blurb: "For teams that need volume and white-glove setup.",
    features: ["Custom credits", "Team seats", "Priority support", "Onboarding"],
  },
];

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[var(--canvas)]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" priority />
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink">
            Contractor <span className="gradient-text">Leads</span>
          </span>
        </Link>
        <div className="hidden items-center gap-6 text-[13px] font-medium text-ink-muted md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#technology" className="hover:text-ink">Technology</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-xl px-3 py-2 text-[13px] font-medium text-ink-muted hover:text-ink sm:inline">
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white"
            style={{ background: LOGO_GRADIENT }}
          >
            Start free <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { x, y } = useMouseParallax(18);
  return (
    <section className="relative min-h-[100svh] overflow-hidden pt-16">
      <MarketingHero3D />
      <motion.div style={{ x, y }} className="pointer-events-none absolute inset-0 -z-0">
        <AuroraBlob className="left-[8%] top-[20%] h-72 w-72 opacity-40" />
        <AuroraBlob className="right-[5%] top-[35%] h-96 w-96 opacity-30" />
      </motion.div>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
        <div>
          <Reveal>
            <p className="mb-4 font-[family-name:var(--font-display)] text-[13px] font-semibold uppercase tracking-[0.22em] text-brand-400">
              Contractor Leads
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,6.5vw,4.6rem)] font-semibold leading-[0.98] tracking-tight text-ink">
              Generate leads that{" "}
              <span className="gradient-text">actually convert</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-muted">
              Live contractor discovery, AI qualification, and outreach — one premium workspace for agencies that sell results.
            </p>
          </Reveal>
          <Reveal delay={0.12} className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_48px_rgba(236,72,153,0.35)]"
              style={{ background: LOGO_GRADIENT }}
            >
              Start free trial <HiOutlineBolt className="h-4 w-4" />
            </Link>
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white/5 px-5 py-3.5 text-[14px] font-semibold text-ink backdrop-blur"
            >
              <HiOutlinePlay className="h-4 w-4 text-brand-400" /> Watch product
            </a>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-2">
              {["SA", "MK", "JL", "RT"].map((a) => (
                <span
                  key={a}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--canvas)] text-[11px] font-bold text-white"
                  style={{ background: LOGO_GRADIENT }}
                >
                  {a}
                </span>
              ))}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">Trusted by growth agencies</p>
              <p className="text-[12px] text-ink-faint">4.9 · Lead quality focus · 20 free credits</p>
            </div>
          </Reveal>
          <Reveal delay={0.28} className="mt-8 flex flex-wrap gap-6">
            {[
              { n: 12840, s: "+", l: "Leads scored" },
              { n: 34, s: "%", l: "Avg reply lift" },
              { n: 20, s: "", l: "Trial credits" },
            ].map((stat) => (
              <div key={stat.l}>
                <p className="font-[family-name:var(--font-display)] text-[28px] font-semibold text-ink">
                  <AnimatedNumber value={stat.n} suffix={stat.s} />
                </p>
                <p className="text-[12px] text-ink-faint">{stat.l}</p>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.15} y={48} className="relative hidden lg:block">
          <FloatingDashboard />
        </Reveal>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="relative overflow-hidden border-y border-violet-100 bg-gradient-to-b from-[#f4f7ff] via-[#faf5ff] to-[#fdf2f8] py-14 sm:py-16">
      <CloudDecor />
      <SparklesDecor />
      <div className="relative z-10">
        <p className="mb-6 text-center text-[13px] font-medium text-slate-500">
          Agencies scaling home-service pipelines
        </p>
        <InfiniteMarquee speed={35}>
          {LOGOS.map((name) => (
            <span
              key={name}
              className="whitespace-nowrap rounded-full border border-white/80 bg-white/75 px-5 py-2 text-[14px] font-semibold tracking-tight text-slate-600 shadow-sm backdrop-blur"
            >
              {name}
            </span>
          ))}
        </InfiniteMarquee>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="relative overflow-hidden bg-[var(--canvas)] py-24 sm:py-32">
      <AuroraBlob className="left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 opacity-35" />
      <div className="relative mx-auto max-w-6xl px-5 text-center sm:px-8">
        <Reveal>
          <SectionEyebrow>Product</SectionEyebrow>
          <SectionTitle className="mx-auto mt-3 max-w-2xl">
            A floating command center for contractor demand
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-ink-muted">
            Glass panels, live scores, and pipeline motion — built to feel like Linear meets a trading desk.
          </p>
        </Reveal>
        <div className="mt-14">
          <FloatingDashboard />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f5f3ff] to-white py-24 sm:py-28">
      <SoftBlob color="violet" className="-right-16 top-20 h-64 w-64" />
      <SoftBlob color="pink" className="-left-10 bottom-10 h-56 w-56" />
      <CloudDecor side="right" className="opacity-70" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionEyebrow>The problem</SectionEyebrow>
            <SectionTitle className="mt-3 text-slate-900">
              Contractor growth dies in the handoff
            </SectionTitle>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
              Fake lists, slow follow-up, and five tabs of tools — agencies lose deals before the first estimate.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {PAINS.slice(0, 4).map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_10px_30px_rgba(100,60,160,0.06)]"
                  >
                    <Icon className="h-5 w-5 text-violet-500" />
                    <h3 className="mt-2 text-[14px] font-semibold text-slate-900">{p.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{p.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
              <ContentPhoto
                src={MARKETING_PHOTOS.contractor}
                alt="Contractor working on a job site"
                className="absolute inset-0"
              />
              <motion.div
                className="absolute -bottom-4 -left-3 z-10 max-w-[200px] rounded-2xl border border-white bg-white/95 p-3 shadow-xl backdrop-blur sm:-left-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                  Missed opportunity
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-800">
                  Lead went cold in 12 minutes
                </p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function LifestyleBand() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, #ec4899 0%, #d946ef 45%, #7c3aed 100%)",
        }}
      />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-6 px-5 sm:grid-cols-3 sm:px-8">
        {[
          { img: MARKETING_PHOTOS.home, label: "Home-service niches", sub: "HVAC · Roofing · Plumbing" },
          { img: MARKETING_PHOTOS.meeting, label: "Agency outreach", sub: "Scripts that book calls" },
          { img: MARKETING_PHOTOS.analytics, label: "Live scoring", sub: "Hot · Warm · Nurture" },
        ].map((item, i) => (
          <Reveal key={item.label} delay={i * 0.08}>
            <div className="group relative aspect-[5/4] overflow-hidden rounded-[28px] shadow-2xl ring-2 ring-white/30">
              <Image
                src={item.img}
                alt={item.label}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <p className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-white">
                  {item.label}
                </p>
                <p className="text-[13px] text-white/75">{item.sub}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function SolutionBento() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#faf5ff] to-[#fdf2f8] py-24">
      <CloudDecor side="left" className="opacity-60" />
      <SparklesDecor className="top-10" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Solution
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold tracking-tight text-slate-900">
            One system. Zero busywork.
          </h2>
        </Reveal>
        <div className="mt-12 grid auto-rows-[minmax(160px,auto)] gap-4 md:grid-cols-4 md:grid-rows-2">
          <Reveal className="md:col-span-2 md:row-span-2">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-violet-100 bg-white p-7 shadow-[0_16px_48px_rgba(100,60,160,0.08)]">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-violet-500">
                  Lead Finder
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[28px] font-semibold text-slate-900">
                  Search any trade in any metro
                </h3>
                <p className="mt-3 max-w-sm text-[14px] text-slate-500">
                  Filters for industry, country, city, ZIP, and custom areas — with social + owner requirements.
                </p>
              </div>
              <div className="relative mt-8 h-40 overflow-hidden rounded-2xl">
                <Image
                  src={MARKETING_PHOTOS.laptop}
                  alt="Agency workspace"
                  fill
                  className="object-cover"
                  sizes="600px"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 to-pink-500/20" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="md:col-span-2">
            <div className="flex h-full gap-4 overflow-hidden rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_12px_40px_rgba(100,60,160,0.07)]">
              <div className="relative hidden h-28 w-28 shrink-0 overflow-hidden rounded-2xl sm:block">
                <Image src={MARKETING_PHOTOS.team} alt="Team" fill className="object-cover" sizes="112px" />
              </div>
              <div>
                <HiOutlineSparkles className="h-6 w-6 text-violet-500" />
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[20px] font-semibold text-slate-900">
                  AI qualification that feels human
                </h3>
                <p className="mt-2 text-[14px] text-slate-500">
                  Revenue bands, opportunity scores, and a one-line angle your SDR can send today.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="h-full rounded-[28px] border border-violet-100 bg-white p-6 shadow-sm">
              <HiOutlineMap className="h-5 w-5 text-violet-500" />
              <h3 className="mt-3 text-[16px] font-semibold text-slate-900">Map HUD</h3>
              <p className="mt-1 text-[13px] text-slate-500">Global density at a glance.</p>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="h-full rounded-[28px] border border-violet-100 bg-white p-6 shadow-sm">
              <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-violet-500" />
              <h3 className="mt-3 text-[16px] font-semibold text-slate-900">Ask Expert</h3>
              <p className="mt-1 text-[13px] text-slate-500">Chat history that remembers.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section id="features" className="relative overflow-hidden bg-gradient-to-b from-[#fdf2f8] via-white to-[#f5f3ff] py-24 sm:py-28">
      <CloudDecor side="both" className="opacity-45" />
      <SoftBlob color="pink" className="left-10 top-10 h-48 w-48" />
      <SoftBlob color="violet" className="bottom-10 right-10 h-56 w-56" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Features
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold tracking-tight text-slate-900">
            Twelve instruments. One desk.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 4) * 0.04}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_10px_30px_rgba(100,60,160,0.06)]"
                >
                  <div
                    className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 0%, rgba(236,72,153,0.12), transparent 55%)",
                    }}
                  />
                  <span
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="relative mt-4 text-[15px] font-semibold text-slate-900">{f.title}</h3>
                  <p className="relative mt-1.5 text-[13px] leading-relaxed text-slate-500">{f.copy}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 40%"],
  });
  const line = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ff] to-white py-24">
      <SoftBlob color="violet" className="left-1/2 top-0 h-64 w-64 -translate-x-1/2" />
      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Workflow
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-tight text-slate-900">
            From search to booked job
          </h2>
        </Reveal>
        <div className="relative mt-14">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-violet-100 sm:left-1/2 sm:-translate-x-px" />
          <motion.div
            className="absolute left-[15px] top-2 w-px sm:left-1/2 sm:-translate-x-px"
            style={{ height: line, background: LOGO_GRADIENT }}
          />
          <div className="space-y-8">
            {WORKFLOW.map((step, i) => (
              <Reveal key={step} delay={i * 0.04}>
                <div className={`flex items-center gap-4 ${i % 2 === 1 ? "sm:flex-row-reverse" : ""}`}>
                  <div
                    className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white sm:absolute sm:left-1/2 sm:-translate-x-1/2"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    {i + 1}
                  </div>
                  <div
                    className={`flex-1 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:max-w-[42%] ${
                      i % 2 === 1 ? "sm:mr-auto" : "sm:ml-auto"
                    }`}
                  >
                    <p className="text-[14px] font-semibold text-slate-900">{step}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section className="relative overflow-hidden border-y border-violet-100 bg-white py-16">
      <Reveal className="mb-8 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
          Integrations
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2.25rem)] font-semibold text-slate-900">
          Plugged into the stack you already trust
        </h2>
      </Reveal>
      <InfiniteMarquee speed={42} reverse>
        {INTEGRATIONS.map((name) => (
          <span
            key={name}
            className="whitespace-nowrap rounded-full border border-violet-100 bg-[#f8f5ff] px-5 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm"
          >
            {name}
          </span>
        ))}
      </InfiniteMarquee>
    </section>
  );
}

const TECH_LOGOS = [
  "Next.js",
  "React",
  "OpenAI",
  "Three.js",
  "Framer Motion",
  "Tailwind CSS",
  "Prisma",
  "PostgreSQL",
  "Google Places",
  "Meta",
  "Railway",
  "TypeScript",
];

const TECH_CARDS = [
  {
    title: "Next.js + React",
    copy: "App Router, server components, and a blistering UI shell — enterprise speed without the enterprise weight.",
    visual: "next",
    tags: ["App Router", "SSR", "TypeScript"],
  },
  {
    title: "OpenAI",
    copy: "Live lead qualification, revenue bands, and multi-turn Ask Expert — powered by gpt-4o-mini when your key is live.",
    visual: "ai",
    tags: ["Scoring", "Chat", "Outreach"],
  },
  {
    title: "Google Places + Prisma",
    copy: "Real contractor businesses from Places, persisted in Postgres — never a stale CSV dump.",
    visual: "data",
    tags: ["Places API", "Postgres", "Prisma"],
  },
  {
    title: "Framer + Three.js",
    copy: "Scroll storytelling, tilt cards, and a 3D lead orb — the marketing site moves like a product demo.",
    visual: "motion",
    tags: ["R3F", "Motion", "Parallax"],
  },
];

function TechVisual({ kind }: { kind: string }) {
  if (kind === "next") {
    return (
      <div className="relative flex h-full min-h-[140px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1030] via-[#2a1548] to-[#ec4899]/40 p-4">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #a855f7, transparent 50%)" }} />
        <div className="relative grid w-full max-w-[140px] gap-1.5">
          {[72, 48, 90].map((w, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-full bg-white/90 shadow-lg"
              style={{ width: `${w}%` }}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08 }}
            />
          ))}
          <div className="mt-2 flex gap-1">
            <span className="h-8 flex-1 rounded-xl bg-white/15 backdrop-blur" />
            <span className="h-8 w-8 rounded-xl" style={{ background: LOGO_GRADIENT }} />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "ai") {
    return (
      <div className="relative flex h-full min-h-[140px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a0a3d] to-[#7c3aed]/50 p-4">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_0_40px_rgba(236,72,153,0.55)]"
          style={{ background: LOGO_GRADIENT }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <HiOutlineSparkles className="h-8 w-8" />
        </motion.div>
        <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[10px] text-white/80 backdrop-blur">
          Qualifying lead… score 91
        </div>
      </div>
    );
  }
  if (kind === "data") {
    return (
      <div className="relative flex h-full min-h-[140px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#312e81]/60 p-4">
        <div className="relative h-24 w-24 rounded-full border border-dashed border-pink-300/40">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="absolute h-2.5 w-2.5 rounded-full"
              style={{
                background: LOGO_GRADIENT,
                top: `${50 + 38 * Math.sin((i / 6) * Math.PI * 2)}%`,
                left: `${50 + 38 * Math.cos((i / 6) * Math.PI * 2)}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          <HiOutlineMap className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-pink-200" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex h-full min-h-[140px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1033] to-[#db2777]/35 p-4">
      <motion.div
        className="h-16 w-16 rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur"
        style={{ rotateX: 18, rotateY: -22, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -8, 0], rotateZ: [0, 4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-10 w-10 rounded-xl"
        style={{ background: LOGO_GRADIENT, right: "22%", top: "28%" }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function TechnologiesSection() {
  return (
    <section
      id="technology"
      className="marketing-tech-section relative overflow-hidden py-20 sm:py-28"
    >
      {/* Bright Gamma-like sky — keep this section light */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #f4f7ff 0%, #e8f0fe 35%, #f3e8ff 70%, #fce7f3 100%)",
        }}
      />

      {/* Left cloud */}
      <motion.div
        className="pointer-events-none absolute -left-[8%] top-[4%] z-0 w-[min(52vw,420px)] select-none sm:-left-[4%] sm:top-[2%] lg:w-[480px]"
        aria-hidden
        animate={{ y: [0, -14, 0], x: [0, 6, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/marketing/cloud-left.png"
          alt=""
          width={640}
          height={400}
          className="h-auto w-full drop-shadow-[0_24px_60px_rgba(120,80,180,0.22)]"
          priority={false}
        />
      </motion.div>

      {/* Right cloud */}
      <motion.div
        className="pointer-events-none absolute -right-[10%] top-[8%] z-0 w-[min(55vw,440px)] select-none sm:-right-[5%] sm:top-[4%] lg:w-[500px]"
        aria-hidden
        animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/marketing/cloud-right.png"
          alt=""
          width={640}
          height={400}
          className="h-auto w-full drop-shadow-[0_24px_60px_rgba(120,80,180,0.22)]"
          priority={false}
        />
      </motion.div>

      {/* Soft glow under clouds */}
      <div
        className="pointer-events-none absolute left-[5%] top-[18%] h-40 w-40 rounded-full bg-pink-200/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[8%] top-[22%] h-48 w-48 rounded-full bg-violet-200/50 blur-3xl"
        aria-hidden
      />

      {/* Sparkles */}
      <div
        className="pointer-events-none absolute inset-x-0 top-20 z-[1] flex justify-center gap-16 text-violet-400/70 sm:gap-28"
        aria-hidden
      >
        <motion.span
          className="text-xl"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          ✦
        </motion.span>
        <motion.span
          className="mt-10 text-sm"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: 0.4 }}
        >
          ✧
        </motion.span>
        <motion.span
          className="text-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
        >
          ✦
        </motion.span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[14px] font-medium text-slate-500">
            Your next pipeline is in good company
          </p>
        </Reveal>

        {/* Tech logos — soft white pills on light sky */}
        <Reveal delay={0.06} className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {TECH_LOGOS.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/80 bg-white/70 px-4 py-2 font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-tight text-slate-600 shadow-[0_8px_24px_rgba(100,80,160,0.08)] backdrop-blur-md transition hover:-translate-y-0.5 hover:text-slate-900 sm:text-[15px]"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3rem)] font-semibold tracking-tight text-slate-900">
            Built with world-class technology
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-slate-500">
            Modern stack. Premium motion. Live data — the same tools powering Stripe-level products.
          </p>
        </Reveal>

        {/* Gamma-style 2×2 cards */}
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {TECH_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.06}>
              <TiltCard intensity={7}>
                <motion.article
                  whileHover={{ y: -6 }}
                  className="flex h-full flex-col gap-5 rounded-[28px] border border-white bg-white/95 p-5 shadow-[0_16px_48px_rgba(80,60,140,0.1)] backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6"
                >
                  <div className="w-full shrink-0 sm:w-[42%] sm:max-w-[200px]">
                    <TechVisual kind={card.visual} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                      {card.copy}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsShowcase() {
  const metrics = [
    { label: "Lead quality", value: 86 },
    { label: "Response time", value: 62 },
    { label: "Conversion", value: 41 },
    { label: "Pipeline health", value: 78 },
  ];
  return (
    <section className="relative overflow-hidden bg-[var(--canvas)] py-24">
      <AuroraBlob className="right-0 top-10 h-72 w-72 opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionEyebrow>Analytics</SectionEyebrow>
            <SectionTitle className="mt-3">See the signal, not the noise</SectionTitle>
            <p className="mt-4 text-[15px] text-ink-muted">
              Animated quality bars, booking trends, and forecast cues — so ops and sales share one truth.
            </p>
            <div className="relative mt-8 hidden aspect-[16/10] overflow-hidden rounded-[24px] sm:block">
              <Image
                src={MARKETING_PHOTOS.analytics}
                alt="Analytics dashboard"
                fill
                className="object-cover opacity-90"
                sizes="560px"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#09060f]/80 via-transparent to-fuchsia-500/20" />
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m, i) => (
              <Reveal key={m.label} delay={i * 0.06}>
                <Glass className="p-5">
                  <p className="text-[12px] text-ink-faint">{m.label}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-[32px] font-semibold text-ink">
                    <AnimatedNumber value={m.value} suffix="%" />
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-50">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: LOGO_GRADIENT }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.1 }}
                    />
                  </div>
                </Glass>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  const prompts = [
    "Write a cold email for roofing owners",
    "What’s my Facebook ad hook?",
    "Prioritize Hot vs Warm this week",
  ];
  const [active, setActive] = useState(0);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ff] via-white to-[#fdf2f8] py-24">
      <CloudDecor side="right" className="opacity-50" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(100,60,160,0.15)] lg:max-w-none">
              <Image
                src={MARKETING_PHOTOS.meeting}
                alt="Agency team planning outreach"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(236,72,153,0.35), transparent 50%, rgba(124,58,237,0.35))",
                }}
              />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
              AI Assistant
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-tight text-slate-900">
              Your growth expert on call
            </h2>
            <p className="mt-4 text-[15px] text-slate-500">
              Floating chat with history, presets, and streaming replies — powered by your business profile.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {prompts.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
                    active === i
                      ? "border-transparent text-white"
                      : "border-violet-100 bg-white text-slate-600 hover:border-violet-300"
                  }`}
                  style={active === i ? { background: LOGO_GRADIENT } : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-violet-100 bg-white p-5 shadow-[0_12px_40px_rgba(100,60,160,0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ background: LOGO_GRADIENT }}
                >
                  <HiOutlineSparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">Ask Contractor Leads</p>
                  <p className="text-[12px] text-slate-400">Streaming · multi-turn</p>
                </div>
              </div>
              <div className="ml-auto mb-3 max-w-[90%] rounded-2xl rounded-br-md px-4 py-3 text-[13px] text-white" style={{ background: LOGO_GRADIENT }}>
                {prompts[active]}
              </div>
              <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-violet-50 bg-[#f8f5ff] px-4 py-3 text-[13px] leading-relaxed text-slate-600">
                Here’s a direct angle: lead with the ZIPs they’re sleeping on, promise booked estimates in 14 days, and CTA with a 15‑min fit call…
                <motion.span
                  className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 bg-violet-500"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-gradient-to-b from-white to-[#f5f3ff] py-24 sm:py-28"
    >
      <CloudDecor side="left" className="opacity-40" />
      <SparklesDecor />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Pricing
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-slate-900">
            Simple plans. Serious pipeline.
          </h2>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${!yearly ? "text-white" : "text-slate-500"}`}
              style={!yearly ? { background: LOGO_GRADIENT } : undefined}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${yearly ? "text-white" : "text-slate-500"}`}
              style={yearly ? { background: LOGO_GRADIENT } : undefined}
            >
              Yearly · save 20%
            </button>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const price = plan.custom
              ? "Custom"
              : `$${yearly ? Math.round(plan.price * 0.8) : plan.price}`;
            return (
              <Reveal key={plan.name} delay={i * 0.08}>
                <motion.div whileHover={{ y: -8 }} className="h-full">
                  <div
                    className={`flex h-full flex-col rounded-[28px] border bg-white p-7 shadow-[0_16px_48px_rgba(100,60,160,0.08)] ${
                      plan.popular
                        ? "border-transparent ring-2 ring-violet-400"
                        : "border-violet-100"
                    }`}
                    style={
                      plan.popular
                        ? { boxShadow: "0 0 0 1px transparent, 0 20px 50px rgba(168,85,247,0.2)" }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-slate-900">
                        {plan.name}
                      </h3>
                      {plan.popular ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white"
                          style={{ background: LOGO_GRADIENT }}
                        >
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[13px] text-slate-500">{plan.blurb}</p>
                    <p className="mt-6 font-[family-name:var(--font-display)] text-[40px] font-semibold text-slate-900">
                      {price}
                      {!plan.custom ? (
                        <span className="text-[14px] font-medium text-slate-400">/mo</span>
                      ) : null}
                    </p>
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-[13px] text-slate-600">
                          <HiOutlineCheck className="h-4 w-4 text-violet-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/register"
                      className="mt-8 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-[13px] font-semibold text-white"
                      style={{ background: LOGO_GRADIENT }}
                    >
                      {plan.custom ? "Talk to us" : "Start free"}
                    </Link>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CaseStudies() {
  const cases = [
    {
      title: "HVAC agency · Phoenix",
      metric: "+212%",
      label: "qualified leads / mo",
      quote: "We stopped buying lists. AI scoring cut wasted dials in half.",
      img: MARKETING_PHOTOS.home,
    },
    {
      title: "Roofing media · Austin",
      metric: "3.1×",
      label: "reply rate",
      quote: "Owner enrichment + Meta checks made every pitch sharper.",
      img: MARKETING_PHOTOS.contractor,
    },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#faf5ff] to-[#fdf2f8] py-24">
      <CloudDecor side="left" className="opacity-40" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Case studies
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-slate-900">
            Proof in the pipeline
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <TiltCard>
                <article className="overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-[0_16px_48px_rgba(100,60,160,0.08)]">
                  <div className="relative h-44 sm:h-52">
                    <Image
                      src={c.img}
                      alt={c.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 30%, rgba(15,10,30,0.75))",
                      }}
                    />
                  </div>
                  <div className="p-7">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-violet-500">
                      {c.title}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-[40px] font-semibold text-slate-900">
                      {c.metric}
                    </p>
                    <p className="text-[13px] text-slate-400">{c.label}</p>
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                      &ldquo;{c.quote}&rdquo;
                    </p>
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const filtered = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.a.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section id="faq" className="relative overflow-hidden bg-white py-24">
      <SoftBlob color="violet" className="right-0 top-0 h-48 w-48" />
      <div className="relative z-10 mx-auto max-w-2xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            FAQ
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-tight text-slate-900">
            Answers, not fluff
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="mt-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-2xl border border-violet-100 bg-[#f8f5ff] px-4 py-3 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </Reveal>
        <div className="mt-6 space-y-2">
          {filtered.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-[14px] font-semibold text-slate-900">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                    <HiOutlineChevronDown className="h-4 w-4 text-slate-400" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[14px] leading-relaxed text-slate-500">
                        {f.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #ec4899 0%, #d946ef 40%, #7c3aed 100%)",
        }}
      />
      <CloudDecor className="opacity-30 mix-blend-soft-light" />
      <SparklesDecor className="text-white/70" />
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,5.5vw,3.75rem)] font-semibold tracking-tight text-white">
            Ready to feel the need for leads?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-white/80">
            Start with 20 free credits. No card. Ship your first qualified batch today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-[15px] font-semibold text-violet-700 shadow-xl transition hover:bg-white/95"
            >
              Start free trial <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/40 bg-white/10 px-6 py-4 text-[14px] font-semibold text-white backdrop-blur"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[12px] text-white/75">
            <span className="inline-flex items-center gap-1">
              <HiOutlineShieldCheck className="h-3.5 w-3.5" /> Business email verified
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineBolt className="h-3.5 w-3.5" /> Fast onboarding
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineCheck className="h-3.5 w-3.5" /> Cancel anytime
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const columns = [
    {
      h: "Product",
      links: [
        ["Features", "#features"],
        ["Technology", "#technology"],
        ["Lead Finder", "/register"],
        ["AI Assistant", "#features"],
        ["Pricing", "#pricing"],
        ["Integrations", "#features"],
        ["FAQ", "#faq"],
        ["Start free", "/register"],
      ],
    },
    {
      h: "Company",
      links: [
        ["About", "#"],
        ["Sign in", "/login"],
        ["Register", "/register"],
        ["Help", "#faq"],
        ["Contact", "mailto:hello@contractorleads.us"],
        ["Security", "#"],
      ],
    },
    {
      h: "Social",
      links: [
        ["Instagram", "#"],
        ["LinkedIn", "#"],
        ["TikTok", "#"],
        ["X", "#"],
        ["YouTube", "#"],
      ],
    },
    {
      h: "Legal",
      links: [
        ["Privacy Policy", "#"],
        ["Terms of Service", "#"],
        ["Cookie Notice", "#"],
        ["Acceptable Use", "#"],
      ],
    },
  ];

  return (
    <footer className="marketing-gamma-footer relative isolate overflow-hidden">
      {/* Starry / noise gradient canvas */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(88,28,135,0.45), transparent 55%), linear-gradient(180deg, #07060f 0%, #0c0820 42%, #120a28 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 85% 25%, rgba(255,255,255,0.3), transparent)",
          backgroundSize: "120px 120px, 180px 180px, 90px 90px, 150px 150px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      {/* Soft aurora drip above watermark */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-[min(90%,720px)] -translate-x-1/2 opacity-60 blur-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(236,72,153,0.55), rgba(168,85,247,0.35), transparent)",
        }}
        aria-hidden
      />

      {/* Giant CONTRACTOR watermark */}
      <div className="relative mx-auto max-w-[100vw] overflow-hidden pt-16 sm:pt-20">
        <p
          aria-hidden
          className="marketing-footer-wordmark select-none text-center font-[family-name:var(--font-display)] font-bold uppercase leading-none tracking-[-0.06em]"
        >
          CONTRACTOR
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl border-t border-white/10 px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand / get started column */}
          <div className="lg:col-span-1">
            <p className="text-[13px] font-semibold text-white">Get started</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12px] font-semibold text-neutral-900 transition hover:bg-white/90"
              >
                Start for free
                <HiOutlineArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="text-[12px] font-medium text-white/55">
                Contractor Leads
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.h}>
              <p className="text-[13px] font-semibold text-white">{col.h}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[13px] text-white/55 transition hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Contractor Leads. All rights reserved.</p>
          <p className="text-white/30">Built for agencies that sell to contractors.</p>
        </div>
      </div>
    </footer>
  );
}

function StickyCta() {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 sm:block">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--canvas)]/90 px-5 py-2.5 text-[13px] font-semibold text-ink shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <span className="h-2 w-2 rounded-full" style={{ background: LOGO_GRADIENT }} />
        Start free — 20 credits
        <span className="rounded-full px-2 py-0.5 text-[11px] text-white" style={{ background: LOGO_GRADIENT }}>
          Go
        </span>
      </Link>
    </div>
  );
}

export function MarketingPage() {
  return (
    <div className="marketing-site relative min-h-screen bg-[var(--canvas)] text-ink">
      <SpotlightCursor />
      <Nav />
      <Hero />
      <SocialProof />
      <DashboardSection />
      <ProblemSection />
      <LifestyleBand />
      <SolutionBento />
      <FeaturesGrid />
      <WorkflowSection />
      <Integrations />
      <TechnologiesSection />
      <AnalyticsShowcase />
      <AiSection />
      <Pricing />
      <CaseStudies />
      <Faq />
      <FinalCta />
      <Footer />
      <StickyCta />
    </div>
  );
}
