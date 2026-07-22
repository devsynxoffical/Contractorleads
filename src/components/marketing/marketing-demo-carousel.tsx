"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./marketing-ui";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: "home",
    image: "/lighttheme1.png",
    alt: "Home and AI assistant workspace",
    label: "Home + AI",
    caption: "Ask Expert drafts outreach while your KPIs stay in view.",
    typed: "Scoring roofing leads in Austin…",
    cursorPath: [
      { x: "72%", y: "38%" },
      { x: "58%", y: "52%" },
      { x: "64%", y: "61%" },
    ],
  },
  {
    id: "dashboard",
    image: "/lighttheme2.png",
    alt: "Dashboard with KPIs and quick lead search",
    label: "Dashboard",
    caption: "Credits, hot leads, and searches update live — no spreadsheet refresh.",
    typed: "Lead Finder · Roofing · Dallas TX",
    cursorPath: [
      { x: "28%", y: "42%" },
      { x: "46%", y: "48%" },
      { x: "52%", y: "58%" },
    ],
  },
  {
    id: "lead",
    image: "/lighttheme3.png",
    alt: "Lead detail with AI score and owner enrichment",
    label: "Lead detail",
    caption: "Owner, socials, and opportunity scores land before you dial.",
    typed: "Owner verified · LinkedIn + Meta ads found",
    cursorPath: [
      { x: "68%", y: "34%" },
      { x: "62%", y: "48%" },
      { x: "55%", y: "66%" },
    ],
  },
] as const;

const SLIDE_MS = 5200;

function useTypewriter(text: string, active: boolean, speed = 28) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) {
      setOut("");
      return;
    }
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, active, speed]);
  return out;
}

function AnimatedCursor({
  path,
  active,
}: {
  path: readonly { x: string; y: string }[];
  active: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    setStep(0);
    const timers = path.map((_, i) =>
      window.setTimeout(() => setStep(i), 450 + i * 900),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, path]);

  const point = path[Math.min(step, path.length - 1)];

  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      animate={{ left: point.x, top: point.y }}
      transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.6 }}
      style={{ translateX: "-20%", translateY: "-10%" }}
      aria-hidden
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 3.5L19 12.2l-6.1 1.4 1.7 6.4-3.1 1.1-1.8-6.5L5.5 3.5Z"
          fill="#111827"
          stroke="#fff"
          strokeWidth="1.2"
        />
      </svg>
      <span className="absolute left-4 top-5 h-3 w-3 rounded-full bg-fuchsia-500/80 blur-[1px]" />
    </motion.div>
  );
}

export function MarketingDemoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index];
  const typed = useTypewriter(slide.typed, !paused, 26);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  return (
    <section
      id="interactive-demo"
      className="relative -mt-6 overflow-hidden bg-[#04050c] px-4 pb-10 pt-2 sm:-mt-8 sm:px-6 sm:pb-12 sm:pt-3 lg:px-8"
      aria-label="Product demo carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[min(640px,100%)] -translate-x-1/2 opacity-40 blur-[80px]"
        style={{ background: LOGO_GRADIENT }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[980px]">
        <Reveal variant="up" y={20}>
          <div className="mb-4 text-center sm:mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/90">
              Live product preview
            </p>
            <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-[clamp(1.15rem,2.5vw,1.55rem)] font-semibold tracking-tight text-white">
              Watch the platform work — three automated views
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-relaxed text-white/55">
              Cursor paths, typed actions, and real product screens. Pause anytime by hovering.
            </p>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={0.1}>
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-3 rounded-[28px] opacity-35 blur-2xl sm:-inset-4"
              style={{ background: LOGO_GRADIENT }}
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-[18px] border border-white/15 bg-[#ece9f2] shadow-[0_24px_64px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:rounded-[20px]">
              <div className="flex items-center gap-2 border-b border-slate-200/80 bg-[#faf8fb] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="mx-auto truncate text-[11px] font-medium text-slate-400">
                  contractorleads.us — {slide.label}
                </span>
              </div>

              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f4f2f7] sm:aspect-[2940/1672]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      className="object-contain object-top"
                      sizes="(max-width: 1024px) 94vw, 980px"
                      priority={slide.id === "home"}
                    />
                    <AnimatedCursor path={slide.cursorPath} active />
                  </motion.div>
                </AnimatePresence>

                {/* Automation typing HUD */}
                <div className="absolute bottom-3 left-3 right-3 z-30 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md">
                  <div className="rounded-2xl border border-white/20 bg-[#111827]/88 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-300">
                      Automating
                    </p>
                    <p className="mt-1 min-h-[1.25rem] font-mono text-[12px] text-white sm:text-[13px]">
                      {typed}
                      <motion.span
                        className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] bg-fuchsia-300"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity }}
                      />
                    </p>
                    <p className="mt-1 text-[11px] text-white/55">{slide.caption}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 flex items-center justify-center gap-2.5" role="tablist" aria-label="Demo slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${s.label}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === index
                  ? "w-7 bg-fuchsia-400"
                  : "w-2.5 bg-white/25 hover:bg-white/45",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
