"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineFire,
  HiOutlineMapPin,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlineChartBar,
  HiOutlineBolt,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCurrencyDollar,
  HiOutlineSignal,
} from "react-icons/hi2";
import { FaLinkedinIn } from "react-icons/fa6";
import {
  SiGooglemaps,
  SiAnthropic,
  SiStripe,
  SiMeta,
  SiYelp,
  SiGoogleanalytics,
} from "react-icons/si";
import { RiOpenaiFill } from "react-icons/ri";
import { Reveal, TiltCard } from "./marketing-ui";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import {
  SOCIAL_BRANDS,
  BrandLogoChip,
  BrandLogoMark,
} from "./brand-logos";

function MotionBackdrop({
  src,
  className = "",
  opacity = 0.5,
}: {
  src: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

/** hills.webp — product stage showcase (static, not sticky) */
export function HillsProductStage() {
  const cards = [
    {
      id: "hot",
      eyebrow: "Lead status",
      value: "HOT",
      meta: "Roofing · Austin, TX",
      detail: "Score 94 — ready for outreach",
      icon: HiOutlineFire,
      tone: "solid" as const,
      ring: 94,
    },
    {
      id: "credits",
      eyebrow: "Credits",
      value: "450",
      meta: "Ready to search",
      detail: "Trial balance · top-up anytime",
      icon: HiOutlineCurrencyDollar,
      tone: "light" as const,
    },
    {
      id: "coverage",
      eyebrow: "Coverage",
      value: "5 countries",
      meta: "Tier‑1 metros lit",
      detail: "US · CA · UK · AU · NZ",
      icon: HiOutlineMapPin,
      tone: "glass" as const,
    },
    {
      id: "verified",
      eyebrow: "Verified",
      value: "Owner found",
      meta: "LinkedIn + site",
      detail: "Marcus R. · Summit Roofing",
      icon: HiOutlineCheckBadge,
      tone: "glass" as const,
    },
    {
      id: "meta",
      eyebrow: "Meta Ads",
      value: "Active",
      meta: "Competitor spend spotted",
      detail: "Pitch with real context",
      icon: HiOutlineBolt,
      tone: "solid" as const,
    },
    {
      id: "ai",
      eyebrow: "Ask Expert",
      value: "Script ready",
      meta: "SMS + email + opener",
      detail: "ICP-aware angles saved",
      icon: HiOutlineChatBubbleLeftRight,
      tone: "light" as const,
      ring: 97,
    },
  ];

  const [active, setActive] = useState(cards[0].id);
  const current = cards.find((c) => c.id === active) ?? cards[0];
  const CurrentIcon = current.icon;

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-[#12081f]" />
      <MotionBackdrop
        src="/marketing/hills.webp"
        opacity={0.55}
        className="mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2e1065]/50 via-transparent to-[#0a0514]/95" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300">
            Product stage
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.5vw,3.25rem)] font-semibold tracking-tight text-white">
            Signals that move with the landscape
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/70">
            The same HOT scores, credits, owners, and AI scripts your team sees
            inside Contractor Leads — previewed on the terrain.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            const isOn = active === card.id;
            const isLight = card.tone === "light";
            const isSolid = card.tone === "solid";

            return (
              <Reveal key={card.id} delay={(i % 3) * 0.05}>
                <motion.button
                  type="button"
                  onClick={() => setActive(card.id)}
                  onMouseEnter={() => setActive(card.id)}
                  whileHover={{ y: -5, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={`group relative w-full overflow-hidden rounded-[24px] border p-5 text-left shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl transition sm:rounded-[26px] sm:p-6 ${
                    isOn
                      ? isLight
                        ? "border-fuchsia-300/60 bg-white shadow-fuchsia-500/20"
                        : "border-fuchsia-400/50 bg-[#1a0f2e]/95 ring-1 ring-fuchsia-400/30"
                      : isLight
                        ? "border-white/50 bg-white/95"
                        : isSolid
                          ? "border-white/15 bg-[#1a0f2e]/80"
                          : "border-white/15 bg-white/[0.08]"
                  }`}
                >
                  {(isLight || isOn) && (
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl"
                      style={{ background: LOGO_GRADIENT }}
                      aria-hidden
                    />
                  )}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          isLight ? "text-fuchsia-600" : "text-fuchsia-300"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {card.eyebrow}
                      </p>
                      <p
                        className={`mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-tight sm:text-[26px] ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {card.value}
                      </p>
                      <p
                        className={`mt-1.5 text-[13px] ${
                          isLight ? "text-slate-500" : "text-white/60"
                        }`}
                      >
                        {card.meta}
                      </p>
                      <p
                        className={`mt-3 text-[12px] leading-relaxed ${
                          isLight ? "text-slate-400" : "text-white/45"
                        }`}
                      >
                        {card.detail}
                      </p>
                    </div>
                    {"ring" in card && card.ring != null ? (
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-lg"
                        style={{ background: LOGO_GRADIENT }}
                      >
                        {card.ring}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isLight
                            ? "bg-fuchsia-50 text-fuchsia-600"
                            : "bg-white/10 text-white/80"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                </motion.button>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.12} className="mx-auto mt-8 max-w-xl sm:mt-10">
          <div className="flex items-center gap-4 rounded-[22px] border border-white/15 bg-[#12081f]/88 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineSignal className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300">
                Live signal
              </p>
              <p className="mt-0.5 truncate font-[family-name:var(--font-display)] text-[17px] font-semibold text-white">
                {current.eyebrow}: {current.value}
              </p>
              <p className="truncate text-[13px] text-white/60">{current.detail}</p>
            </div>
            <CurrentIcon className="hidden h-7 w-7 shrink-0 text-fuchsia-300 sm:block" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** moon-walk.webp — dark cinematic feature grid (once) */
export function MoonWalkFeatureGrid() {
  const tiles = [
    {
      title: "Map density",
      copy: "See where contractor demand clusters before you spend a credit.",
      badge: "Lead Map",
      brand: {
        name: "Maps",
        icon: SiGooglemaps,
        color: "#4285F4",
        bg: "#e8f0fe",
      },
    },
    {
      title: "HOT alerts",
      copy: "Scores and outreach angles stream in as the search finishes.",
      badge: "Live queue",
      brand: {
        name: "OpenAI",
        icon: RiOpenaiFill,
        color: "#000000",
        bg: "#f4f4f5",
      },
    },
    {
      title: "Reputation",
      copy: "Reviews and opportunity scores so you pitch winners first.",
      badge: "Top rated",
      brand: {
        name: "Yelp",
        icon: SiYelp,
        color: "#FF1A1A",
        bg: "#ffe8e8",
      },
    },
    {
      title: "Verified owners",
      copy: "LinkedIn + social filters — no empty shells in the export.",
      badge: "Verified",
      brand: {
        name: "LinkedIn",
        icon: FaLinkedinIn,
        color: "#0A66C2",
        bg: "#e8f1fb",
      },
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-[#07040f]" />
      <MotionBackdrop src="/marketing/moon-walk.webp" opacity={0.42} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07040f]/40 via-[#07040f]/55 to-[#07040f]/92" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
            Under moonlight
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-white">
            Four desks. Zero busywork.
          </h2>
          <p className="mt-3 text-[15px] text-white/65">
            Cinematic moon-walk film behind interactive feature cards — hover to
            lift each desk.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {tiles.map((t, i) => {
            return (
              <Reveal key={t.title} delay={i * 0.06}>
                <TiltCard intensity={7}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative h-full overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.07] p-6 backdrop-blur-md"
                  >
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl transition group-hover:bg-fuchsia-400/30" />
                    <div className="flex items-center gap-2.5">
                      <BrandLogoMark
                        brand={t.brand}
                        className="h-10 w-10"
                        iconClassName="h-5 w-5"
                      />
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85">
                        {t.badge}
                      </span>
                    </div>
                    <h3 className="mt-4 font-[family-name:var(--font-display)] text-[22px] font-semibold text-white">
                      {t.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                      {t.copy}
                    </p>
                    <Link
                      href="/register"
                      className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-fuchsia-300 transition group-hover:gap-2 group-hover:text-white"
                    >
                      Explore <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** purple-desert.webp — full-bleed CTA band (once) */
export function MaterialHillsCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative min-h-[48vh] sm:min-h-[56vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/purple-desert.webp"
          alt="Purple desert brand film"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e]/90 via-[#2e1065]/55 to-transparent" />
        <div className="relative z-10 flex min-h-[48vh] items-center px-5 py-16 sm:min-h-[56vh] sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Reveal>
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200">
                Brand film
              </p>
              <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.4rem)] font-semibold tracking-tight text-white">
                Terrain built for serious agencies
              </h2>
              <p className="mt-4 max-w-md text-[15px] text-white/75">
                Purple desert motion behind a single clear CTA — start free, find
                contractors, book the call.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 shadow-lg transition hover:bg-fuchsia-50"
                >
                  Start free trial <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-5 py-3 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/** flower-field.webp — soft light card gallery (once) */
export function FlowerFieldProofCards() {
  const cards = [
    {
      icon: RiOpenaiFill,
      title: "34% reply lift",
      body: "Agencies that score before dialing stop wasting SDRs on nurture junk.",
      color: "#000000",
      bg: "#f4f4f5",
    },
    {
      icon: SiGooglemaps,
      title: "Tier‑1 coverage",
      body: "US, Canada, UK, Australia, New Zealand — one Lead Finder for all of them.",
      color: "#4285F4",
      bg: "#e8f0fe",
    },
    {
      icon: FaLinkedinIn,
      title: "Owner enrichment",
      body: "Website people scrape + LinkedIn resolve so every pitch has a name.",
      color: "#0A66C2",
      bg: "#e8f1fb",
    },
    {
      icon: SiAnthropic,
      title: "Ask Expert memory",
      body: "Multi-turn chat that knows your ICP, offer, and last scripts.",
      color: "#D4A27F",
      bg: "#faf4ef",
    },
    {
      icon: SiStripe,
      title: "20 trial credits",
      body: "Explore Lead Finder and AI without a card — upgrade when it converts.",
      color: "#635BFF",
      bg: "#eeedff",
    },
    {
      icon: SiMeta,
      title: "AI angles",
      body: "Revenue bands and one-line outreach that feels written by your best closer.",
      color: "#0866FF",
      bg: "#e7f0ff",
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-[#fdfbff]" />
      <MotionBackdrop src="/marketing/flower-field.webp" opacity={0.28} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbff]/80 via-[#fdfbff]/70 to-[#fdfbff]" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Why agencies stay
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-slate-900">
            Clarity in the field
          </h2>
          <p className="mt-3 text-[15px] text-slate-600">
            Soft flower-field motion behind glass cards — proof points you can
            feel, not another dense feature wall.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={(i % 3) * 0.05}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group h-full rounded-[24px] border border-white/80 bg-white/85 p-6 shadow-[0_8px_32px_rgba(80,40,120,0.08)] backdrop-blur-md transition hover:border-fuchsia-200/80 hover:shadow-[0_16px_48px_rgba(217,70,239,0.12)]"
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-black/[0.04]"
                    style={{ background: c.bg, color: c.color }}
                  >
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-[18px] font-semibold text-slate-900">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                    {c.body}
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

/** Hyros-style bento — no film background (unique layout) */
export function SocialProofBento() {
  const proof = [
    {
      type: "stat" as const,
      value: "34%",
      label: "avg reply lift",
      span: "sm:col-span-1",
      brand: {
        name: "OpenAI",
        icon: RiOpenaiFill,
        color: "#000000",
        bg: "#f4f4f5",
      },
    },
    {
      type: "quote" as const,
      quote:
        "We stopped buying stale lists. Scoring + owner enrichment made every dial count.",
      name: "Maya K.",
      role: "Agency founder · Phoenix",
      span: "sm:col-span-2",
      brand: {
        name: "LinkedIn",
        icon: FaLinkedinIn,
        color: "#0A66C2",
        bg: "#e8f1fb",
      },
    },
    {
      type: "stat" as const,
      value: "12k+",
      label: "leads scored",
      span: "sm:col-span-1",
      brand: {
        name: "Analytics",
        icon: SiGoogleanalytics,
        color: "#E37400",
        bg: "#fef0e0",
      },
    },
    {
      type: "quote" as const,
      quote: "Meta Ads checks before the pitch — we finally sound informed.",
      name: "Jordan L.",
      role: "Media buyer · Austin",
      span: "sm:col-span-2",
      brand: {
        name: "Meta",
        icon: SiMeta,
        color: "#0866FF",
        bg: "#e7f0ff",
      },
    },
    {
      type: "brand" as const,
      title: "Transparent pipeline",
      body: "Credits, searches, and CRM status in one workspace — no black-box lists.",
      span: "sm:col-span-2",
    },
    {
      type: "stat" as const,
      value: "20",
      label: "trial credits",
      span: "sm:col-span-1",
      brand: {
        name: "Stripe",
        icon: SiStripe,
        color: "#635BFF",
        bg: "#eeedff",
      },
    },
    {
      type: "quote" as const,
      quote: "Ask Expert remembers our ICP. Scripts land in one click.",
      name: "Sam R.",
      role: "SDR lead · Denver",
      span: "sm:col-span-3",
      brand: {
        name: "Anthropic",
        icon: SiAnthropic,
        color: "#D4A27F",
        bg: "#faf4ef",
      },
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#ffffff] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Social proof
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3.1rem)] font-semibold tracking-tight text-slate-900">
            Agencies that switched off fake lists
          </h2>
        </Reveal>

        <Reveal delay={0.05} className="mt-8">
          <div className="flex flex-wrap gap-2.5">
            {SOCIAL_BRANDS.slice(0, 8).map((brand) => (
              <BrandLogoChip key={brand.name} brand={brand} size="sm" />
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {proof.map((item, i) => (
            <Reveal key={i} delay={(i % 4) * 0.04} className={item.span}>
              <motion.div
                whileHover={{ y: -3 }}
                className="h-full rounded-[22px] border border-slate-200/90 bg-[#f7f5f9] p-6 transition hover:border-fuchsia-200 hover:shadow-[0_12px_36px_rgba(100,60,160,0.08)]"
              >
                {item.type === "stat" && (
                  <>
                    {"brand" in item && item.brand && (
                      <BrandLogoMark
                        brand={item.brand}
                        className="mb-4 h-10 w-10"
                        iconClassName="h-5 w-5"
                      />
                    )}
                    <p className="font-[family-name:var(--font-display)] text-[42px] font-semibold tracking-tight text-slate-900 sm:text-[48px]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {item.label}
                    </p>
                  </>
                )}
                {item.type === "quote" && (
                  <>
                    <p className="text-[16px] leading-relaxed text-slate-700 sm:text-[17px]">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <BrandLogoMark
                        brand={item.brand}
                        className="h-10 w-10"
                        iconClassName="h-5 w-5"
                      />
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-[12px] text-slate-500">{item.role}</p>
                      </div>
                    </div>
                  </>
                )}
                {item.type === "brand" && (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {SOCIAL_BRANDS.slice(0, 4).map((b) => (
                        <BrandLogoMark
                          key={b.name}
                          brand={b}
                          className="h-9 w-9"
                          iconClassName="h-4 w-4"
                        />
                      ))}
                    </div>
                    <p className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                      {item.body}
                    </p>
                    <Link
                      href="/register"
                      className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-fuchsia-600 hover:underline"
                    >
                      Start free <HiOutlineArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
