"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "react-icons/hi2";
import { FaLinkedinIn, FaSlack } from "react-icons/fa6";
import {
  SiGooglemaps,
  SiGoogleearth,
  SiGoogleanalytics,
  SiGmail,
  SiYelp,
  SiMeta,
  SiAnthropic,
  SiHubspot,
  SiInstagram,
  SiStripe,
  SiZapier,
} from "react-icons/si";
import { RiOpenaiFill } from "react-icons/ri";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { FloatingDashboard } from "./marketing-dashboard";
import {
  CloudDecor,
  SparklesDecor,
  SoftBlob,
  MARKETING_PHOTOS,
} from "./marketing-decor";
import {
  Reveal,
  TiltCard,
  AnimatedNumber,
  InfiniteMarquee,
} from "./marketing-ui";
import { MarketingFluidHero } from "./marketing-fluid-hero";
import {
  HillsProductStage,
  MoonWalkFeatureGrid,
  MaterialHillsCta,
  FlowerFieldProofCards,
  SocialProofBento,
} from "./marketing-interactive-sections";
import { StickyPlatformScroll } from "./marketing-sticky-platform";
import {
  SOCIAL_BRANDS,
  INTEGRATION_BRANDS,
  TECH_BRANDS,
  BrandLogoChip,
  BrandLogoMark,
} from "./brand-logos";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const FEATURES = [
  {
    icon: RiOpenaiFill,
    title: "AI Lead Scoring",
    copy: "Hot / Warm / Nurture with revenue bands and outreach angles.",
    color: "#000000",
    bg: "#f4f4f5",
  },
  {
    icon: SiGooglemaps,
    title: "Lead Finder",
    copy: "Live Places search across Tier‑1 markets and custom areas.",
    color: "#4285F4",
    bg: "#e8f0fe",
  },
  {
    icon: SiGoogleearth,
    title: "World Map HUD",
    copy: "See pipeline density by country and metro in one view.",
    color: "#34A853",
    bg: "#e6f4ea",
  },
  {
    icon: SiAnthropic,
    title: "AI Assistant",
    copy: "Multi-turn chat with history for offers, hooks, and scripts.",
    color: "#D4A27F",
    bg: "#faf4ef",
  },
  {
    icon: FaLinkedinIn,
    title: "Owner Enrichment",
    copy: "Website people scrape + LinkedIn company/owner resolve.",
    color: "#0A66C2",
    bg: "#e8f1fb",
  },
  {
    icon: SiMeta,
    title: "Meta Ads Intel",
    copy: "Ads Library checks so you know who already spends on Meta.",
    color: "#0866FF",
    bg: "#e7f0ff",
  },
  {
    icon: SiGmail,
    title: "Outreach Studio",
    copy: "Email, SMS, and call scripts saved to your library.",
    color: "#EA4335",
    bg: "#fce8e6",
  },
  {
    icon: SiGoogleanalytics,
    title: "Opportunity Scores",
    copy: "Website, PPC, SEO, and marketing upside scored 0–100.",
    color: "#E37400",
    bg: "#fef0e0",
  },
  {
    icon: FaSlack,
    title: "Live Activity",
    copy: "Search results and AI replies stream as they happen.",
    color: "#4A154B",
    bg: "#f4eaf5",
  },
  {
    icon: SiHubspot,
    title: "Business Context",
    copy: "Answers adapt to your agency profile and ICP.",
    color: "#FF7A59",
    bg: "#fff0eb",
  },
  {
    icon: SiInstagram,
    title: "Social Presence Filter",
    copy: "Require LinkedIn + social + owner before a lead lands.",
    color: "#E4405F",
    bg: "#fce8ee",
  },
  {
    icon: SiYelp,
    title: "Verified Sources",
    copy: "Google, Yelp, and site data — never invented phones.",
    color: "#FF1A1A",
    bg: "#ffe8e8",
  },
];

const PAINS = [
  {
    icon: SiStripe,
    title: "Buying fake leads",
    body: "Purchased lists go stale before your first dial.",
    color: "#635BFF",
    bg: "#eeedff",
  },
  {
    icon: SiGoogleanalytics,
    title: "Low conversion",
    body: "No scoring means SDRs burn time on nurture junk.",
    color: "#E37400",
    bg: "#fef0e0",
  },
  {
    icon: FaSlack,
    title: "Manual follow-up",
    body: "Tabs, sheets, and notes never stay in sync.",
    color: "#4A154B",
    bg: "#f4eaf5",
  },
  {
    icon: SiGmail,
    title: "Slow response",
    body: "Competitors reply while you’re still enriching.",
    color: "#EA4335",
    bg: "#fce8e6",
  },
  {
    icon: SiZapier,
    title: "Disconnected tools",
    body: "Maps, ads, CRM, and AI live in five different apps.",
    color: "#FF4A00",
    bg: "#fff0e8",
  },
  {
    icon: SiMeta,
    title: "Blind ad spend",
    body: "You pitch PPC without knowing if they already run Meta.",
    color: "#0866FF",
    bg: "#e7f0ff",
  },
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

function ScrollNav() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-[#ffffff]/90 backdrop-blur-xl transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" priority />
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-slate-900">
            Contractor <span className="gradient-text">Leads</span>
          </span>
        </Link>
        <div className="hidden items-center gap-6 text-[13px] font-medium text-slate-500 md:flex">
          <a href="#features" className="transition hover:text-slate-900">Features</a>
          <a href="#technology" className="transition hover:text-slate-900">Technology</a>
          <a href="#pricing" className="transition hover:text-slate-900">Pricing</a>
          <a href="#faq" className="transition hover:text-slate-900">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:text-slate-900 sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
            style={{ background: LOGO_GRADIENT }}
          >
            Start free <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function SocialProof() {
  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-[#ffffff] py-12 sm:py-14">
      <div className="relative z-10">
        <p className="mb-6 text-center text-[13px] font-medium text-slate-500">
          Powered by the stack agencies already trust
        </p>
        <InfiniteMarquee speed={35}>
          {SOCIAL_BRANDS.map((brand) => (
            <BrandLogoChip key={brand.name} brand={brand} />
          ))}
        </InfiniteMarquee>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="relative overflow-hidden bg-[#09060f] py-24 sm:py-32"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[100px]"
        style={{ background: LOGO_GRADIENT }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-6xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
            Product
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold tracking-tight text-white">
            A floating command center for contractor demand
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/65">
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
    <section className="relative overflow-x-clip bg-[#ffffff] py-24 sm:py-28">
      <SoftBlob color="violet" className="-right-16 top-20 h-64 w-64 opacity-40" />
      <SoftBlob color="pink" className="-left-10 bottom-10 h-56 w-56 opacity-35" />
      <CloudDecor side="right" className="opacity-55" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.15fr] lg:gap-10">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
              The problem
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold tracking-tight text-slate-900">
              Contractor growth dies in the handoff
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
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
                    className="rounded-2xl border border-slate-200 bg-[#ffffff] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-black/[0.04]"
                      style={{ background: p.bg, color: p.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-2 text-[14px] font-semibold text-slate-900">{p.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{p.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative flex items-center lg:justify-end">
            <div className="relative mx-auto w-full max-w-3xl lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[764/463] w-full min-h-[280px] sm:min-h-[340px] lg:min-h-[420px]">
                <Image
                  src={MARKETING_PHOTOS.contractor}
                  alt="Connected platforms and contractor growth tools"
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 100vw, 760px"
                  priority
                />
              </div>
              <motion.div
                className="absolute bottom-2 left-2 z-10 max-w-[220px] rounded-2xl border border-slate-200 bg-[#ffffff] p-3.5 shadow-xl sm:bottom-4 sm:left-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-600">
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

function SolutionBento() {
  return (
    <section className="relative overflow-hidden bg-[#ffffff] py-24">
      <CloudDecor side="left" className="opacity-45" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Solution
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold tracking-tight text-slate-900">
            One system. Zero busywork.
          </h2>
        </Reveal>
        <div className="mt-12 grid auto-rows-[minmax(160px,auto)] gap-4 md:grid-cols-4 md:grid-rows-2">
          <Reveal className="md:col-span-2 md:row-span-2">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200 bg-[#ffffff] p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-fuchsia-600">
                  Lead Finder
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[28px] font-semibold text-slate-900">
                  Search any trade in any metro
                </h3>
                <p className="mt-3 max-w-sm text-[14px] text-slate-600">
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
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/35 to-pink-500/15" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="md:col-span-2">
            <div className="flex h-full gap-4 overflow-hidden rounded-[28px] border border-slate-200 bg-[#ffffff] p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
              <div className="relative hidden h-28 w-28 shrink-0 overflow-hidden rounded-2xl sm:block">
                <Image src={MARKETING_PHOTOS.team} alt="Team" fill className="object-cover" sizes="112px" />
              </div>
              <div>
                <BrandLogoMark
                  brand={{
                    name: "OpenAI",
                    icon: RiOpenaiFill,
                    color: "#000000",
                    bg: "#f4f4f5",
                  }}
                  className="h-10 w-10"
                  iconClassName="h-5 w-5"
                />
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[20px] font-semibold text-slate-900">
                  AI qualification that feels human
                </h3>
                <p className="mt-2 text-[14px] text-slate-600">
                  Revenue bands, opportunity scores, and a one-line angle your SDR can send today.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="h-full rounded-[28px] border border-slate-200 bg-[#ffffff] p-6 shadow-sm">
              <BrandLogoMark
                brand={{
                  name: "Maps",
                  icon: SiGoogleearth,
                  color: "#34A853",
                  bg: "#e6f4ea",
                }}
                className="h-9 w-9"
                iconClassName="h-4 w-4"
              />
              <h3 className="mt-3 text-[16px] font-semibold text-slate-900">Map HUD</h3>
              <p className="mt-1 text-[13px] text-slate-500">Global density at a glance.</p>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="h-full rounded-[28px] border border-slate-200 bg-[#ffffff] p-6 shadow-sm">
              <BrandLogoMark
                brand={{
                  name: "Anthropic",
                  icon: SiAnthropic,
                  color: "#D4A27F",
                  bg: "#faf4ef",
                }}
                className="h-9 w-9"
                iconClassName="h-4 w-4"
              />
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
    <section id="features" className="relative overflow-hidden bg-[#ffffff] py-24 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 10% 20%, rgba(253,242,248,0.85), transparent 60%), radial-gradient(ellipse 35% 30% at 92% 15%, rgba(245,243,255,0.9), transparent 55%)",
        }}
        aria-hidden
      />
      <CloudDecor side="both" className="opacity-50" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Features
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold tracking-tight text-slate-900">
            Twelve instruments. One desk.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
            Every tool your agency needs to find, score, and book contractors — without leaving the workspace.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 4) * 0.04}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group relative h-full overflow-hidden rounded-[22px] border border-slate-200/90 bg-[#ffffff] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-shadow hover:border-fuchsia-200/80 hover:shadow-[0_16px_40px_rgba(217,70,239,0.12)]"
                >
                  <span
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-black/[0.04]"
                    style={{ background: f.bg, color: f.color }}
                  >
                    <Icon className="h-[22px] w-[22px]" />
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

function Integrations() {
  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-[#ffffff] py-16">
      <Reveal className="mb-8 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
          Integrations
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2.25rem)] font-semibold text-slate-900">
          Plugged into the stack you already trust
        </h2>
      </Reveal>
      <InfiniteMarquee speed={42} reverse>
        {INTEGRATION_BRANDS.map((brand) => (
          <BrandLogoChip key={brand.name} brand={brand} />
        ))}
      </InfiniteMarquee>
    </section>
  );
}

const TECH_LOGOS = TECH_BRANDS;

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
            {TECH_LOGOS.map((brand) => (
              <BrandLogoChip key={brand.name} brand={brand} size="sm" />
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
                  className="flex h-full flex-col gap-5 rounded-[28px] border border-slate-200/80 bg-[#ffffff] p-5 shadow-[0_16px_48px_rgba(80,60,140,0.1)] sm:flex-row sm:items-center sm:gap-6 sm:p-6"
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
    <section className="relative overflow-hidden bg-[#09060f] py-24">
      <div
        className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full opacity-35 blur-[90px]"
        style={{ background: LOGO_GRADIENT }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              Analytics
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-white">
              See the signal, not the noise
            </h2>
            <p className="mt-4 text-[15px] text-white/65">
              Animated quality bars, booking trends, and forecast cues — so ops and sales share one truth.
            </p>
            <div className="relative mt-8 hidden aspect-[16/10] overflow-hidden rounded-[24px] border border-white/10 sm:block">
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <p className="text-[12px] text-white/45">{m.label}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-[32px] font-semibold text-white">
                    <AnimatedNumber value={m.value} suffix="%" />
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: LOGO_GRADIENT }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.1 }}
                    />
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

function AiSection() {
  const prompts = [
    "Write a cold email for roofing owners",
    "What’s my Facebook ad hook?",
    "Prioritize Hot vs Warm this week",
  ];
  const [active, setActive] = useState(0);
  return (
    <section className="relative overflow-hidden bg-[#ffffff] py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 85% 20%, rgba(253,242,248,0.8), transparent 55%), radial-gradient(ellipse 40% 35% at 10% 80%, rgba(245,243,255,0.75), transparent 50%)",
        }}
        aria-hidden
      />
      <CloudDecor side="right" className="opacity-45" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[22px] border border-slate-200/80 bg-[#0b0614] shadow-[0_20px_60px_rgba(100,60,160,0.18)] lg:max-w-none">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#12081f] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                <span className="ml-2 truncate text-[11px] font-medium text-white/45">
                  contractorleads.us
                </span>
              </div>
              <div className="relative aspect-[2940/1672] w-full">
                <Image
                  src="/darktheme1.png"
                  alt="Ask Contractor Leads AI assistant"
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
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
                      : "border-slate-200 bg-[#ffffff] text-slate-600 hover:border-fuchsia-200"
                  }`}
                  style={active === i ? { background: LOGO_GRADIENT } : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#ffffff] p-5 shadow-[0_12px_40px_rgba(100,60,160,0.08)]">
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
      className="relative overflow-hidden bg-[#ffffff] py-24 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(245,243,255,0.9), transparent 60%)",
        }}
        aria-hidden
      />
      <CloudDecor side="left" className="opacity-40" />
      <SparklesDecor />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Pricing
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-slate-900">
            Simple plans. Serious pipeline.
          </h2>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#ffffff] p-1 shadow-sm">
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
                    className={`flex h-full flex-col rounded-[28px] border bg-[#ffffff] p-7 shadow-[0_16px_48px_rgba(100,60,160,0.08)] ${
                      plan.popular
                        ? "border-transparent ring-2 ring-fuchsia-400/80"
                        : "border-slate-200"
                    }`}
                    style={
                      plan.popular
                        ? { boxShadow: "0 0 0 1px transparent, 0 20px 50px rgba(217,70,239,0.18)" }
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

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const filtered = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.a.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section id="faq" className="relative overflow-hidden bg-[#ffffff] py-24">
      <SoftBlob color="violet" className="right-0 top-0 h-48 w-48" />
      <div className="relative z-10 mx-auto max-w-2xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
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
                className="overflow-hidden rounded-2xl border border-slate-200 bg-[#ffffff] shadow-sm"
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
              className="inline-flex items-center gap-2 rounded-2xl bg-[#ffffff] px-7 py-4 text-[15px] font-semibold text-violet-700 shadow-xl transition hover:bg-fuchsia-50"
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

      {/* Giant CONTRACTOR LEADS watermark */}
      <div className="relative mx-auto max-w-[100vw] overflow-hidden pt-16 sm:pt-20">
        <p
          aria-hidden
          className="marketing-footer-wordmark select-none text-center font-[family-name:var(--font-display)] font-bold uppercase leading-none tracking-[-0.06em]"
        >
          CONTRACTOR LEADS
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
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffffff] px-4 py-2.5 text-[12px] font-semibold text-neutral-900 transition hover:bg-fuchsia-50"
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
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#ffffff]/95 px-5 py-2.5 text-[13px] font-semibold text-slate-800 shadow-[0_12px_40px_rgba(80,40,120,0.18)] backdrop-blur-xl"
      >
        <span className="h-2 w-2 rounded-full" style={{ background: LOGO_GRADIENT }} />
        Start free — 20 credits
        <span
          className="rounded-full px-2 py-0.5 text-[11px] text-white"
          style={{ background: LOGO_GRADIENT }}
        >
          Go
        </span>
      </Link>
    </div>
  );
}

export function MarketingPage() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (prev) root.setAttribute("data-theme", prev);
      else root.removeAttribute("data-theme");
    };
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      lerp: 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.15,
    });
    let raf = 0;
    function frame(t: number) {
      lenis.raf(t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="marketing-site relative min-h-screen bg-[#ffffff] text-slate-900">
      <ScrollNav />
      <MarketingFluidHero />
      <SocialProof />
      <HillsProductStage />
      <MoonWalkFeatureGrid />
      <FlowerFieldProofCards />
      <DashboardSection />
      <ProblemSection />
      <MaterialHillsCta />
      <SolutionBento />
      <SocialProofBento />
      <FeaturesGrid />
      <StickyPlatformScroll />
      <Integrations />
      <TechnologiesSection />
      <AnalyticsShowcase />
      <AiSection />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
      <StickyCta />
    </div>
  );
}
