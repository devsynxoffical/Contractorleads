"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineArrowRight,
} from "react-icons/hi2";
import { FaLinkedinIn } from "react-icons/fa6";
import {
  SiGooglemaps,
  SiAnthropic,
  SiMeta,
  SiYelp,
  SiGoogleanalytics,
} from "react-icons/si";
import { RiOpenaiFill } from "react-icons/ri";
import { Reveal, TiltCard } from "./marketing-ui";
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

/** moon-walk.webp — dark cinematic feature grid (once) */
export function MoonWalkFeatureGrid() {
  const tiles = [
    {
      title: "Map density",
      copy: "See where contractor demand is clustering by metro before you spend a dollar on outreach. Zoom into a ZIP, a county, or a whole state and watch lead density shift in real time.",
      badge: "Lead Map",
      brand: {
        name: "Maps",
        icon: SiGooglemaps,
        color: "#4285F4",
        bg: "#e8f0fe",
      },
    },
    {
      title: "Hot alerts",
      copy: "Get flagged the moment a business crosses into the Hot tier — new listing, rising review velocity, or a site overhaul that signals they're investing in growth.",
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
      copy: "Google rating, review count, and review velocity pulled live so you're not pitching a business that's quietly losing trust in its own market.",
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
      copy: "We surface the actual decision-maker — owner, founder, or GM — scraped from the business's own site and cross-checked, not guessed from a name pattern.",
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
            Workflow
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-white">
            Four desks. Zero busywork.
          </h2>
          <p className="mt-3 text-[15px] text-white/65">
            Everything a lead-gen desk juggles across five tabs, we collapsed into four panels.
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

/** purple-desert.webp — full-bleed CTA band (removed from homepage) */
export function MaterialHillsCta() {
  return null;
}

/** flower-field.webp — soft light card gallery (once) */
export function FlowerFieldProofCards() {
  const cards = [
    {
      icon: RiOpenaiFill,
      title: "AI reply speed",
      body: "Ask Contractor Leads answers in seconds, not a support ticket queue.",
      color: "#000000",
      bg: "#f4f4f5",
    },
    {
      icon: SiGooglemaps,
      title: "Coverage window",
      body: "Live search across Tier-1 markets, any hour.",
      color: "#4285F4",
      bg: "#e8f0fe",
    },
    {
      icon: FaLinkedinIn,
      title: "Add Expert onboarding",
      body: "AI walks new users through their first search.",
      color: "#0A66C2",
      bg: "#e8f1fb",
    },
    {
      icon: SiAnthropic,
      title: "Trial credits included",
      body: "Start with real search credits, not a locked demo.",
      color: "#D4A27F",
      bg: "#faf4ef",
    },
    {
      icon: SiMeta,
      title: "Fast setup",
      body: "From signup to your first qualified batch in minutes.",
      color: "#0866FF",
      bg: "#e7f0ff",
    },
    {
      icon: SiGoogleanalytics,
      title: "Book a fit call",
      body: "Talk to us before you commit to a plan.",
      color: "#E37400",
      bg: "#fef0e0",
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
            Why agencies use it
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3rem)] font-semibold tracking-tight text-slate-900">
            Clarity in the field
          </h2>
          <p className="mt-3 text-[15px] text-slate-600">
            The details that make a list usable instead of just impressive.
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
      label:
        "Average lift in reply rate when outreach references a verified opportunity score instead of a generic pitch",
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
        "[Placeholder] We stopped padding our lists with dead numbers the week we switched.",
      name: "Agency founder",
      role: "[industry] vertical",
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
      label: "Businesses indexed and actively refreshed across live searches",
      span: "sm:col-span-1",
      brand: {
        name: "Analytics",
        icon: SiGoogleanalytics,
        color: "#E37400",
        bg: "#fef0e0",
      },
    },
    {
      type: "brand" as const,
      title: "Transparent pipeline",
      body: "Every lead's source and verification status is visible — no black-box scraping",
      span: "sm:col-span-2",
    },
    {
      type: "stat" as const,
      value: "20",
      label: "Free trial credits to run your first real search, no card required",
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
        "[Placeholder] The outreach angle alone saved our SDRs an hour a day of research.",
      name: "Media buyer",
      role: "[agency name]",
      span: "sm:col-span-3",
      brand: {
        name: "Meta",
        icon: SiMeta,
        color: "#0866FF",
        bg: "#e7f0ff",
      },
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#ffffff] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Results
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,3.1rem)] font-semibold tracking-tight text-slate-900">
            Agencies that switched off fake lists
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            The numbers agencies actually track once they stop buying static lists.
          </p>
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
                    <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                      {item.label}
                    </p>
                  </>
                )}
                {item.type === "quote" && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Testimonial placeholder
                    </p>
                    <p className="mt-2 text-[16px] leading-relaxed text-slate-700 sm:text-[17px]">
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
                    <p className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                      {item.body}
                    </p>
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
