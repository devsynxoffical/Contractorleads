"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

const STEPS = [
  {
    id: "home",
    title: "Contractor Leads Intelligence Platform",
    body: "Connect Places search, AI scoring, owner enrichment, Meta ads intel, and outreach — in one workspace. No spreadsheet stitching. No guessing who to dial.",
    image: "/lighttheme1.png",
    imageAlt: "Home and AI assistant workspace",
  },
  {
    id: "dashboard",
    title: "Dashboard built for daily pipeline",
    body: "Credits, searches, hot leads, and geo coverage in one HUD. Jump into Lead Finder, Lead Map, or Pipeline CRM without leaving the screen.",
    image: "/lighttheme2.png",
    imageAlt: "Dashboard with KPIs and quick lead search",
  },
  {
    id: "lead",
    title: "Every lead, fully enriched",
    body: "Owner names, phones, ratings, revenue bands, and AI lead scores on a single detail view — save to CRM and move from New to booked.",
    image: "/lighttheme3.png",
    imageAlt: "Lead detail with AI score and owner enrichment",
  },
] as const;

function ScreenshotFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute -inset-3 rounded-[28px] opacity-35 blur-2xl sm:-inset-4"
        style={{ background: LOGO_GRADIENT }}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[18px] border border-slate-200/90 bg-white shadow-[0_24px_64px_rgba(80,40,120,0.18)] sm:rounded-[22px]">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-[#faf8fb] px-3.5 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 truncate text-[12px] font-medium text-slate-400">
            contractorleads.us
          </span>
        </div>
        <div className="relative aspect-[2940/1672] w-full bg-[#f4f2f7]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain object-top"
            sizes="(max-width: 1024px) 94vw, 640px"
            priority={src === "/lighttheme1.png"}
          />
        </div>
      </div>
    </div>
  );
}

function StickyVisual({ active }: { active: number }) {
  const step = STEPS[active];

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.985 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <ScreenshotFrame src={step.image} alt={step.imageAlt} />
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === active ? 28 : 8,
              background:
                i === active ? LOGO_GRADIENT : "rgba(148,163,184,0.45)",
            }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Triple Whale–style sticky scroller:
 * left text panels scroll; right screenshot stays pinned and swaps with active panel.
 */
export function StickyPlatformScroll() {
  const [active, setActive] = useState(0);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const activeMv = useMotionValue(0);
  const activeSpring = useSpring(activeMv, {
    stiffness: 90,
    damping: 24,
    mass: 0.4,
  });

  useEffect(() => {
    const unsub = activeSpring.on("change", (v) => {
      const next = Math.round(v);
      setActive((prev) => (prev === next ? prev : next));
    });
    return unsub;
  }, [activeSpring]);

  useEffect(() => {
    const nodes = panelRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          ratios.set(idx, entry.intersectionRatio);
        }
        let best = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = idx;
          }
        });
        activeMv.set(best);
      },
      {
        // Prefer the panel centered in the viewport
        root: null,
        threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        rootMargin: "-22% 0px -28% 0px",
      }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [activeMv]);

  return (
    <section
      className="relative bg-[#f3f1f6]"
      aria-label="Platform sticky scroll"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-8 xl:gap-16">
        {/* Left — tall scrolling text panels */}
        <div className="relative z-10">
          {STEPS.map((step, i) => (
            <article
              key={step.id}
              data-index={i}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="flex min-h-[88vh] flex-col justify-center py-12 lg:min-h-[100vh] lg:py-16"
            >
              <motion.div
                animate={{
                  opacity: active === i ? 1 : 0.28,
                  y: active === i ? 0 : 8,
                }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-fuchsia-600 sm:text-[14px]">
                  Platform
                </p>
                <h2 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.15rem,4.6vw,3.6rem)] font-semibold leading-[1.08] tracking-tight text-slate-900">
                  {step.title}
                </h2>
                <p className="mt-6 max-w-lg text-[17px] leading-[1.65] text-slate-600 sm:text-[19px] sm:leading-[1.7]">
                  {step.body}
                </p>

                {/* Mobile: image under each text block */}
                <div className="mt-10 lg:hidden">
                  <ScreenshotFrame src={step.image} alt={step.imageAlt} />
                </div>
              </motion.div>
            </article>
          ))}
        </div>

        {/* Right — sticky image (desktop) */}
        <div className="relative hidden lg:block">
          <div className="sticky top-[14vh] flex min-h-[72vh] items-center">
            <div className="w-full scale-[1.06] origin-center xl:scale-[1.1]">
              <StickyVisual active={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
