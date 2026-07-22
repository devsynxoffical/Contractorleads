"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import {
  HiOutlineSparkles,
  HiOutlineMap,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

const STEPS = [
  {
    id: "home",
    title: "Contractor Leads Intelligence Platform",
    body: "Google Places search, AI scoring, owner and social enrichment, Meta ad intelligence, and outreach generation — one workspace instead of five browser tabs and a spreadsheet.",
    module: "home" as const,
  },
  {
    id: "dashboard",
    title: "Dashboard built for daily pipeline",
    body: "Credits, searches, hot leads, and geography in one view. Jump straight into Lead Finder, the Lead Map, or your Pipeline CRM without hunting for the right tab.",
    module: "dashboard" as const,
  },
  {
    id: "lead",
    title: "Every lead, fully enriched",
    body: "Owner name, phone, rating, revenue band, and AI opportunity scores land on every lead before you save it — so moving a card from New to Booked is a decision, not a research project.",
    module: "lead" as const,
  },
] as const;

function ModuleShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute -inset-3 rounded-[28px] opacity-40 blur-2xl sm:-inset-4"
        style={{ background: LOGO_GRADIENT }}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[20px] border border-white/15 bg-[#12081f] shadow-[0_30px_80px_rgba(80,40,120,0.4)]">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#1a102c] px-3.5 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 truncate text-[12px] font-medium text-white/45">
            {label}
          </span>
          <span className="ml-auto rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-200">
            Live
          </span>
        </div>
        <div className="relative min-h-[340px] p-4 sm:min-h-[380px] sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function HomeModule() {
  const [msg, setMsg] = useState(0);
  const lines = [
    "Find roofing leads in Austin with LinkedIn…",
    "Score them Hot / Warm and draft outreach.",
    "Check Meta ads before the first call.",
  ];

  useEffect(() => {
    const id = window.setInterval(() => {
      setMsg((m) => (m + 1) % lines.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [lines.length]);

  return (
    <ModuleShell label="Home · AI Assistant">
      <div className="grid h-full gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-2">
          {["Lead Finder", "Hot Leads", "Lead Map", "Ask Expert"].map(
            (item, i) => (
              <motion.div
                key={item}
                className="rounded-xl border border-white/10 bg-[#1a102c] px-3 py-2.5 text-[12px] font-medium text-white/80"
                animate={{
                  borderColor:
                    i === msg
                      ? "rgba(232,121,249,0.55)"
                      : "rgba(255,255,255,0.1)",
                  x: i === msg ? 4 : 0,
                }}
                transition={{ duration: 0.35 }}
              >
                {item}
              </motion.div>
            ),
          )}
        </div>
        <div className="relative flex flex-col rounded-2xl border border-white/10 bg-[#1a102c] p-3">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-fuchsia-200">
            <HiOutlineSparkles className="h-4 w-4" />
            Ask Contractor Leads
          </div>
          <div className="flex-1 space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white/5 px-3 py-2 text-[12px] text-white/55">
              Hey — what should I run today?
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={msg}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-2xl rounded-tr-sm px-3 py-2 text-[12px] text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed55,#ec489955)" }}
              >
                {lines[msg]}
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div
            className="mt-3 h-9 rounded-xl border border-white/10 bg-[#12081f] px-3 text-[11px] leading-9 text-white/35"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Type a market or trade…
          </motion.div>
        </div>
      </div>
    </ModuleShell>
  );
}

function DashboardModule() {
  const bars = [42, 58, 51, 72, 66, 88, 79];
  return (
    <ModuleShell label="Dashboard · Pipeline">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { l: "Credits", v: "9,928" },
          { l: "Hot leads", v: "128" },
          { l: "Searches", v: "46" },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            className="rounded-2xl border border-white/10 bg-[#1a102c] p-3"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity }}
          >
            <p className="text-[10px] uppercase tracking-wider text-white/40">{s.l}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold text-white">
              {s.v}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-[#1a102c] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-white">Weekly volume</p>
            <HiOutlineChartBar className="h-4 w-4 text-fuchsia-300" />
          </div>
          <div className="flex h-28 items-end gap-1.5">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-md"
                style={{ background: LOGO_GRADIENT }}
                animate={{ height: [`${h * 0.45}%`, `${h}%`, `${h * 0.7}%`, `${h}%`] }}
                transition={{ duration: 3.2, delay: i * 0.08, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a102c] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-white">
            <HiOutlineMap className="h-4 w-4 text-fuchsia-300" />
            Density
          </div>
          <div className="relative h-[108px] rounded-xl bg-[#0d0618]">
            {[
              [18, 30],
              [42, 55],
              [68, 28],
              [55, 70],
              [30, 62],
              [78, 48],
            ].map(([x, y], i) => (
              <motion.span
                key={i}
                className="absolute h-2.5 w-2.5 rounded-full bg-fuchsia-400"
                style={{ left: `${x}%`, top: `${y}%` }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2 + i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

function LeadModule() {
  const scores = [
    { l: "Website", v: 84 },
    { l: "Marketing", v: 91 },
    { l: "PPC", v: 76 },
  ];
  return (
    <ModuleShell label="Lead · Enriched profile">
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-[#1a102c] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300">
            Hot · Score 92
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold text-white">
            Summit Roof Pros
          </h3>
          <p className="mt-1 text-[12px] text-white/50">Austin, TX · 4.9★ · 214 reviews</p>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[12px] text-white/75">
              <HiOutlineUser className="h-4 w-4 text-fuchsia-300" />
              Mike Torres · Owner
            </div>
            <div className="flex items-center gap-2 text-[12px] text-white/75">
              <HiOutlinePhone className="h-4 w-4 text-fuchsia-300" />
              (512) 555-0142
            </div>
            <div className="flex items-center gap-2 text-[12px] text-white/75">
              <HiOutlineGlobeAlt className="h-4 w-4 text-fuchsia-300" />
              summitroofpros.com
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {scores.map((s, i) => (
            <div
              key={s.l}
              className="rounded-2xl border border-white/10 bg-[#1a102c] p-3"
            >
              <div className="mb-1.5 flex justify-between text-[11px]">
                <span className="text-white/55">{s.l}</span>
                <span className="font-semibold text-fuchsia-200">{s.v}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: LOGO_GRADIENT }}
                  animate={{ width: [`12%`, `${s.v}%`, `${s.v}%`, `12%`] }}
                  transition={{
                    duration: 3.4,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          ))}
          <motion.div
            className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-200"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            Enrichment complete · Ready to dial
          </motion.div>
        </div>
      </div>
    </ModuleShell>
  );
}

function StepModule({ module }: { module: (typeof STEPS)[number]["module"] }) {
  if (module === "home") return <HomeModule />;
  if (module === "dashboard") return <DashboardModule />;
  return <LeadModule />;
}

function StickyVisual({ active }: { active: number }) {
  const step = STEPS[active];
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <StepModule module={step.module} />
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
 * Sticky scroller: left copy panels; right interactive 3D dashboard modules.
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
        root: null,
        threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        rootMargin: "-22% 0px -28% 0px",
      },
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
                <div className="mt-10 lg:hidden">
                  <StepModule module={step.module} />
                </div>
              </motion.div>
            </article>
          ))}
        </div>

        <div className="relative hidden lg:block">
          <div className="sticky top-[14vh] flex min-h-[72vh] items-center">
            <div className="w-full origin-center scale-[1.04] xl:scale-[1.08]">
              <StickyVisual active={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
