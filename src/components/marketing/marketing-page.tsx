"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IconType } from "react-icons";
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
import { cn } from "@/lib/utils";
import {
  CloudDecor,
  SoftBlob,
  SparklesDecor,
} from "./marketing-decor";
import {
  Reveal,
  TiltCard,
  InfiniteMarquee,
  StaggerReveal,
  StaggerItem,
  SpotlightCursor,
} from "./marketing-ui";
import {
  MarketingScrollProgress,
  MarketingStickyCta,
  MarketingNavLinks,
  FinalCtaActions,
  FooterReveal,
  usePrefersReducedMotion,
} from "./marketing-motion";
import { MarketingFluidHero } from "./marketing-fluid-hero";
import { MarketingInteractiveDemo } from "./marketing-interactive-demo";
import { MarketingAutomationShowcase } from "./marketing-automation-showcase";
import { StickyPlatformScroll } from "./marketing-sticky-platform";
import {
  INTEGRATION_BRANDS,
  TECH_BRANDS,
  BrandLogoChip,
  BrandLogoMark,
} from "./brand-logos";
import { MarketingTrialModals } from "./marketing-trial-modal";
import { MarketingVisitTracker } from "./marketing-visit-tracker";
import { MarketingPricingSection } from "./marketing-pricing-section";
import { setMarketingLenis } from "./marketing-scroll";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const FEATURES = [
  {
    icon: RiOpenaiFill,
    title: "AI Lead Scoring",
    copy: "Hot / Warm / Nurture tiers with opportunity scores and a recommended outreach angle on every business.",
    color: "#000000",
    bg: "#f4f4f5",
  },
  {
    icon: SiGooglemaps,
    title: "Lead Finder",
    copy: "Live Google Places search across five Tier‑1 markets, filterable down to a single ZIP and radius.",
    color: "#4285F4",
    bg: "#e8f0fe",
  },
  {
    icon: SiGoogleearth,
    title: "World Map HUD",
    copy: "See pipeline density by country and metro at a glance, not buried in a spreadsheet.",
    color: "#34A853",
    bg: "#e6f4ea",
  },
  {
    icon: SiAnthropic,
    title: "AI Assistant",
    copy: "Ask Contractor Leads for hooks, offers, funnels, and cold outreach — multi-turn, with saved chat history.",
    color: "#D4A27F",
    bg: "#faf4ef",
  },
  {
    icon: FaLinkedinIn,
    title: "Owner Enrichment",
    copy: "Real decision-maker names pulled from the business's own site, not guessed.",
    color: "#0A66C2",
    bg: "#e8f1fb",
  },
  {
    icon: SiMeta,
    title: "Meta Ads Intel",
    copy: "Check the Facebook Ads Library before you pitch, so you know if they're already spending.",
    color: "#0866FF",
    bg: "#e7f0ff",
  },
  {
    icon: SiGmail,
    title: "Outreach Studio",
    copy: "Generate cold email, cold SMS, follow-up, and full sales scripts per lead in one click.",
    color: "#EA4335",
    bg: "#fce8e6",
  },
  {
    icon: SiGoogleanalytics,
    title: "Opportunity Scores",
    copy: "Website, PPC, SEO, and marketing upside scored 0–100 on every lead.",
    color: "#E37400",
    bg: "#fef0e0",
  },
  {
    icon: FaSlack,
    title: "Live Activity",
    copy: "Watch search results and AI replies stream in as they happen, not after a loading spinner.",
    color: "#4A154B",
    bg: "#f4eaf5",
  },
  {
    icon: SiHubspot,
    title: "Business Context",
    copy: "The AI already knows your company, ICP, and goal from onboarding — you're never re-explaining your business.",
    color: "#FF7A59",
    bg: "#fff0eb",
  },
  {
    icon: SiInstagram,
    title: "Social Presence Filter",
    copy: "Require a verified LinkedIn, social profile, and identified owner before a lead is even accepted into your results.",
    color: "#E4405F",
    bg: "#fce8ee",
  },
  {
    icon: SiYelp,
    title: "Verified Sources",
    copy: "Google, Yelp, and live site data — never a phone number invented to fill a field.",
    color: "#FF1A1A",
    bg: "#ffe8e8",
  },
];

const PAINS = [
  {
    icon: SiStripe,
    title: "Buying fake leads",
    body: "Purchased lists go stale before the first dial — disconnected numbers, closed businesses, and duplicate entries that waste a rep's whole morning.",
    color: "#635BFF",
    bg: "#eeedff",
  },
  {
    icon: SiGoogleanalytics,
    title: "Low conversion",
    body: "Cold outreach without context reads like spam. No owner name, no angle, no proof you looked at their business first.",
    color: "#E37400",
    bg: "#fef0e0",
  },
  {
    icon: FaSlack,
    title: "Manual follow-up",
    body: "The fortune is in the follow-up, and it's also the first thing that falls apart when a rep is juggling forty open threads in a spreadsheet.",
    color: "#4A154B",
    bg: "#f4eaf5",
  },
  {
    icon: SiGmail,
    title: "Slow response",
    body: "A lead that goes 24 hours without a reply is a lead that's already talking to a competitor.",
    color: "#EA4335",
    bg: "#fce8e6",
  },
  {
    icon: SiZapier,
    title: "Disconnected tools",
    body: "Spreadsheet for the list, separate tool for scoring, separate inbox for outreach, separate doc for notes — nothing talks to anything else.",
    color: "#FF4A00",
    bg: "#fff0e8",
  },
  {
    icon: SiMeta,
    title: "Blind ad spend",
    body: "Pitching a contractor on Facebook ads without checking if they're already running them (and how well) is how you lose the meeting in the first thirty seconds.",
    color: "#0866FF",
    bg: "#e7f0ff",
  },
];

const FAQS = [
  {
    q: "Is this for agencies or contractors?",
    a: "Contractor Leads is built for marketing agencies, media buyers, and sales teams that sell services to home-service contractors — not for homeowners trying to find a plumber or roofer.",
  },
  {
    q: "Are the leads real?",
    a: "Yes. Every business comes from live Google Places data, cross-checked against Yelp, Houzz, and the business's own website — never generated or guessed. If we can't verify a data point (like a LinkedIn profile), we leave it blank instead of showing you something wrong.",
  },
  {
    q: "How do credits work?",
    a: "Each lead costs 1.33 credits when you run Lead Finder (for example, 10 leads = 13.3 credits). Asking the AI assistant and generating outreach also use credits. The in-app support chat is always free and never touches your credit balance.",
  },
  {
    q: "Can I filter for LinkedIn + social presence?",
    a: "Yes. Turn on the Social Presence Filter in Lead Finder to only accept leads that have a verified LinkedIn profile, active social presence, and an identified owner — useful when you want a smaller, higher-confidence list over raw volume.",
  },
  {
    q: "Does AI qualification need me to bring my own OpenAI key?",
    a: "No. Scoring, qualification, and the assistant all run on our backend — there's nothing extra for you to configure or pay for separately.",
  },
];

const PARTNER_LOGOS = [
  "image.png",
  "image copy.png",
  "image copy 2.png",
  "image copy 3.png",
  "image copy 4.png",
  "image copy 5.png",
  "image copy 6.png",
  "image copy 7.png",
  "image copy 8.png",
  "image copy 9.png",
  "image copy 10.png",
  "image copy 11.png",
  "image copy 12.png",
].map((name) => `/logos/${encodeURIComponent(name)}`);

function ScrollNav() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-[#ffffff]/90 backdrop-blur-xl"
      initial={false}
      animate={
        shown
          ? { y: 0, opacity: 1, pointerEvents: "auto" as const }
          : { y: "-100%", opacity: 0, pointerEvents: "none" as const }
      }
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ duration: 0.35 }}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" priority />
            <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-slate-900">
              Contractor <span className="gradient-text">Leads</span>
            </span>
          </Link>
        </motion.div>
        <MarketingNavLinks className="hidden md:flex" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:text-slate-900 sm:inline"
          >
            Sign in
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
              style={{ background: LOGO_GRADIENT }}
            >
              Get started free <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

function SocialProof() {
  return (
    <section
      className="relative overflow-hidden bg-[#05040c] py-9 sm:py-11"
      aria-label="Partner brands"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#04050c] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0514] to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal variant="fade">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45 sm:text-[12px]">
            Trusted by leading home-service brands
          </p>
        </Reveal>
      </div>

      <div className="relative mt-6 sm:mt-8">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#05040c] via-[#05040c]/90 to-transparent sm:w-32"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#05040c] via-[#05040c]/90 to-transparent sm:w-32"
          aria-hidden
        />
        <InfiniteMarquee speed={58} gap={40} className="py-2">
          {PARTNER_LOGOS.map((src) => (
            <div
              key={src}
              className="group flex shrink-0 items-center justify-center px-1 transition duration-300 hover:scale-[1.04]"
            >
              <Image
                src={src}
                alt=""
                width={360}
                height={108}
                className="h-[76px] w-auto max-w-[min(300px,50vw)] rounded-md object-contain opacity-90 transition duration-300 group-hover:opacity-100 sm:h-[90px] sm:max-w-[340px] md:h-[104px] md:max-w-[360px]"
              />
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-[#07040f]" />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.42]"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/moon-walk.webp"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#07040f]/40 via-[#07040f]/55 to-[#07040f]/92" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
            The problem
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-white">
            Contractor growth dies in the handoff
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Most agencies do not lose deals because their pitch is weak. They lose them in the six
            silent failure points between &ldquo;found a business&rdquo; and &ldquo;booked a
            call.&rdquo;
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 0.05}>
                <TiltCard intensity={7}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative h-full overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.07] p-6 backdrop-blur-md"
                  >
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl transition group-hover:bg-fuchsia-400/30" />
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10"
                        style={{ background: p.bg, color: p.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85">
                        Failure {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 font-[family-name:var(--font-display)] text-[22px] font-semibold text-white">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                      {p.body}
                    </p>
                  </motion.div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mt-10">
          <Link
            href="#features"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-fuchsia-300 transition hover:gap-3 hover:text-white"
          >
            See how Contractor Leads fixes this
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureLogo({
  icon: Icon,
  color,
  bg,
  index,
  reduced,
}: {
  icon: IconType | ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  index: number;
  reduced: boolean;
}) {
  const pattern = index % 4;
  const idle =
    reduced
      ? undefined
      : pattern === 0
        ? { y: [0, -4, 0], rotate: [0, -4, 0, 4, 0] }
        : pattern === 1
          ? { scale: [1, 1.08, 1], rotate: [0, 6, 0] }
          : pattern === 2
            ? { y: [0, -3, 0], scale: [1, 1.05, 1] }
            : { rotate: [0, 8, -6, 0] };

  return (
    <span className="relative inline-flex">
      {!reduced && (
        <motion.span
          className="absolute inset-0 rounded-xl"
          style={{ background: color, opacity: 0.18 }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0.05, 0.2] }}
          transition={{
            duration: 2.8 + (index % 3) * 0.35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.12,
          }}
          aria-hidden
        />
      )}
      <motion.span
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-black/[0.04] shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
        style={{ background: bg, color }}
        animate={idle}
        transition={
          reduced
            ? undefined
            : {
                duration: 3.2 + (index % 4) * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              }
        }
        whileHover={
          reduced
            ? undefined
            : {
                scale: 1.14,
                rotate: pattern % 2 === 0 ? 8 : -8,
                y: -2,
                boxShadow: `0 12px 28px ${color}33`,
              }
        }
        whileTap={reduced ? undefined : { scale: 0.96 }}
      >
        <motion.span
          className="inline-flex"
          whileHover={
            reduced
              ? undefined
              : {
                  rotate: [0, -12, 12, 0],
                  transition: { duration: 0.55 },
                }
          }
        >
          <Icon className="h-[22px] w-[22px]" />
        </motion.span>
      </motion.span>
    </span>
  );
}

function FeaturesGrid() {
  const reduced = usePrefersReducedMotion();

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
            Every tool a lead-gen desk needs, none of them bolted on.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f, i) => {
            return (
              <Reveal key={f.title} delay={(i % 4) * 0.04}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group relative h-full overflow-hidden rounded-[22px] border border-slate-200/90 bg-[#ffffff] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-shadow hover:border-fuchsia-200/80 hover:shadow-[0_16px_40px_rgba(217,70,239,0.12)]"
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: f.color }}
                    aria-hidden
                  />
                  <FeatureLogo
                    icon={f.icon}
                    color={f.color}
                    bg={f.bg}
                    index={i}
                    reduced={reduced}
                  />
                  <h3 className="relative mt-4 text-[15px] font-semibold text-slate-900">
                    {f.title}
                  </h3>
                  <p className="relative mt-1.5 text-[13px] leading-relaxed text-slate-500">
                    {f.copy}
                  </p>
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
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-500">
          Contractor Leads doesn&apos;t ask you to abandon your CRM, your inbox, or your ad accounts — it feeds them.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-500">
          Push saved leads and status changes straight into Zapier, Make, HubSpot, or a custom endpoint the moment they happen. Send nurture sequences from your own Gmail, Outlook, or SMTP mailbox so replies land in an inbox you already check. Connect your Meta ad account context to see contractor ad activity without leaving the lead profile.
        </p>
      </Reveal>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <InfiniteMarquee speed={42} reverse>
          {INTEGRATION_BRANDS.map((brand) => (
            <BrandLogoChip key={brand.name} brand={brand} />
          ))}
        </InfiniteMarquee>
      </motion.div>
      <p className="mx-auto mt-6 max-w-xl px-5 text-center text-[11px] leading-relaxed text-slate-400 sm:px-8">
        Integrations represent our technology stack and supported connections — availability varies by plan.
      </p>
    </section>
  );
}

const TECH_LOGOS = TECH_BRANDS;

const TECH_CARDS = [
  {
    title: "Next.js + React",
    copy: "Fast, modern interface that doesn't choke on a 500-row lead table.",
    visual: "next",
    tags: ["App Router", "SSR", "TypeScript"],
  },
  {
    title: "OpenAI",
    copy: "Powers scoring, qualification, and the Ask Contractor Leads assistant.",
    visual: "ai",
    tags: ["Scoring", "Chat", "Outreach"],
  },
  {
    title: "Google Places + Prisma",
    copy: "Live business data backed by a real, structured database — not a static CSV.",
    visual: "data",
    tags: ["Places API", "Postgres", "Prisma"],
  },
  {
    title: "Framer + Three.js",
    copy: "The map and motion you're scrolling through right now.",
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
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Under the hood
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3rem)] font-semibold tracking-tight text-slate-900">
            Built with world-class technology
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-slate-500">
            The infrastructure choices that keep search results live instead of stale.
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

function AiSection() {
  const prompts = [
    "Write a cold email for roofing owners",
    "What’s my Facebook ad hook?",
    "Prioritize Hot vs Warm this week",
  ];
  const replies = [
    "Lead with the ZIPs they’re sleeping on, promise booked estimates in 14 days, and CTA with a 15‑min fit call.",
    "Hook: “Your competitors are already in Ads Library — here’s the angle they’re missing.” Keep creative local and proof-heavy.",
    "Call Hot first (score 85+ with owner + LinkedIn). Warm gets a nurture sequence; skip Nurture until next refresh.",
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
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div
                className="pointer-events-none absolute -inset-3 rounded-[28px] opacity-35 blur-2xl"
                style={{ background: LOGO_GRADIENT }}
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[20px] border border-white/15 bg-[#12081f] shadow-[0_30px_80px_rgba(80,40,120,0.35)]">
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#1a102c] px-3.5 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-2 truncate text-[12px] font-medium text-white/45">
                    Ask Contractor Leads · AI Assistant
                  </span>
                  <span className="ml-auto rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-200">
                    Live
                  </span>
                </div>

                <div className="grid min-h-[360px] gap-3 p-4 sm:grid-cols-[0.85fr_1.15fr] sm:p-5">
                  <div className="space-y-2">
                    {["Scripts", "Cold email", "Ad hooks", "Prioritize"].map(
                      (item, i) => (
                        <motion.button
                          key={item}
                          type="button"
                          onClick={() => setActive(i % prompts.length)}
                          className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[12px] font-medium transition"
                          animate={{
                            borderColor:
                              active === i % prompts.length
                                ? "rgba(232,121,249,0.55)"
                                : "rgba(255,255,255,0.1)",
                            backgroundColor:
                              active === i % prompts.length
                                ? "rgba(232,121,249,0.12)"
                                : "rgba(26,16,44,1)",
                            color:
                              active === i % prompts.length
                                ? "rgb(253,244,255)"
                                : "rgba(255,255,255,0.75)",
                          }}
                        >
                          <HiOutlineSparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
                          {item}
                        </motion.button>
                      ),
                    )}
                  </div>

                  <div className="flex flex-col rounded-2xl border border-white/10 bg-[#1a102c] p-3">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-fuchsia-200">
                      <HiOutlineSparkles className="h-4 w-4" />
                      Streaming reply
                    </div>
                    <div className="mb-2 ml-auto max-w-[92%] rounded-2xl rounded-br-md px-3 py-2 text-[12px] text-white"
                      style={{ background: LOGO_GRADIENT }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`q-${active}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {prompts[active]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="max-w-[95%] flex-1 rounded-2xl rounded-bl-md border border-white/10 bg-[#12081f] px-3 py-2.5 text-[12px] leading-relaxed text-white/75">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`a-${active}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {replies[active]}
                        </motion.span>
                      </AnimatePresence>
                      <motion.span
                        className="ml-1 inline-block h-3 w-1 translate-y-0.5 bg-fuchsia-400"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.85, repeat: Infinity }}
                      />
                    </div>
                    <motion.div
                      className="mt-3 h-9 rounded-xl border border-white/10 bg-[#12081f] px-3 text-[11px] leading-9 text-white/35"
                      animate={{ opacity: [0.45, 1, 0.45] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    >
                      Ask about markets, ads, or outreach…
                    </motion.div>
                  </div>
                </div>
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
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
              Ask Contractor Leads isn&apos;t a generic chatbot bolted onto the sidebar. It&apos;s a senior-level growth marketer that already knows your business.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
              The moment you finish onboarding, the assistant knows your company, your ideal customer, your service areas, and your goal — so you never waste a message re-explaining your business. Ask for a cold email, a funnel structure, a stronger CTA, or a straight answer on why your last campaign underperformed. Every answer streams in, gets a one-click copy button, and can be saved straight to your Scripts library for reuse.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white"
              style={{ background: LOGO_GRADIENT }}
            >
              Ask a question free <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
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
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-x-clip overflow-y-visible bg-[#f6f7f9] py-24 sm:py-28"
    >
      <div className="relative z-10 mx-auto max-w-6xl overflow-visible px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Pricing
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-slate-900">
            Plans that scale with your closed deals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-500">
            Start free with 10 leads on Starter. Upgrade when your team is booking
            calls and signing retainers — not before.
          </p>
        </Reveal>
        <MarketingPricingSection />
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
            placeholder="Search questions..."
            className="w-full rounded-2xl border border-violet-100 bg-[#f8f5ff] px-4 py-3 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />
        </Reveal>
        <StaggerReveal className="mt-6 space-y-2" stagger={0.06}>
          {filtered.map((f, i) => {
            const isOpen = open === i;
            return (
              <StaggerItem key={f.q}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#ffffff] shadow-sm transition-shadow hover:shadow-md">
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
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
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
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.5vw,3rem)] font-semibold tracking-tight text-white">
            Ready to feel the need for leads?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-white/80">
            Start with 10 free leads on Starter. No card required. Ship your first qualified batch today.
          </p>
          <FinalCtaActions />
          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[12px] text-white/75"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1">
              <HiOutlineShieldCheck className="h-3.5 w-3.5" /> Business email verified
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineBolt className="h-3.5 w-3.5" /> Fast onboarding
            </span>
            <span className="inline-flex items-center gap-1">
              <HiOutlineCheck className="h-3.5 w-3.5" /> Cancel anytime
            </span>
          </motion.div>
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
        ["Get started free", "/register"],
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
        <FooterReveal>
          <motion.p
            aria-hidden
            className="marketing-footer-wordmark select-none text-center font-[family-name:var(--font-display)] font-bold uppercase leading-none tracking-[-0.06em]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            CONTRACTOR LEADS
          </motion.p>
        </FooterReveal>
      </div>

      <div className="relative mx-auto max-w-6xl border-t border-white/10 px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand / get started column */}
          <FooterReveal delay={0.05}>
            <div className="lg:col-span-1">
            <p className="text-[13px] font-semibold text-white">Get started</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffffff] px-4 py-2.5 text-[12px] font-semibold text-neutral-900 transition hover:bg-fuchsia-50"
              >
                Get started free
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
          </FooterReveal>

          {columns.map((col, ci) => (
            <FooterReveal key={col.h} delay={0.08 + ci * 0.05}>
              <div>
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
            </FooterReveal>
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
  return <MarketingStickyCta />;
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
      anchors: {
        offset: 0,
        duration: 1.05,
      },
    });
    setMarketingLenis(lenis);
    let raf = 0;
    function frame(t: number) {
      lenis.raf(t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      setMarketingLenis(null);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="marketing-site relative min-h-screen bg-[#ffffff] text-slate-900">
      <MarketingScrollProgress />
      <SpotlightCursor />
      <MarketingVisitTracker />
      <ScrollNav />
      <MarketingFluidHero />
      <MarketingInteractiveDemo />
      <SocialProof />
      <FeaturesGrid />
      <ProblemSection />
      <StickyPlatformScroll />
      <MarketingAutomationShowcase />
      <Integrations />
      <TechnologiesSection />
      <AiSection />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
      <StickyCta />
      <MarketingTrialModals />
    </div>
  );
}
