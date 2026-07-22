"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineCursorArrowRays, HiOutlineSparkles } from "react-icons/hi2";
import { Reveal } from "./marketing-ui";

const TYPE_LINES = [
  "Hey Mike — saw your 4.9★ roofing reviews in Austin…",
  "Noticed you're not running Meta ads yet — quick idea?",
  "Your site loads well; PPC could fill the winter gap.",
];

const SCORE_STEPS = [
  { label: "Website quality", value: 82 },
  { label: "Marketing opportunity", value: 91 },
  { label: "Outreach fit", value: 88 },
];

function CursorSearchCard() {
  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border border-slate-200 bg-[#faf8fc] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
        Live search
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[18px] font-semibold text-slate-900">
        Cursor finds the lead
      </h3>
      <p className="mt-1.5 text-[13px] text-slate-500">
        Automation picks Hot businesses from the map without a manual filter pass.
      </p>

      <div className="relative mt-5 h-[188px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-400">
          Lead Finder · Roofing · Austin TX
        </div>
        <div className="space-y-2 p-3">
          {["Summit Roof Pros", "BluePeak HVAC", "Lone Star Build"].map(
            (name, i) => (
              <motion.div
                key={name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                animate={{
                  borderColor:
                    i === 0
                      ? ["rgb(241 245 249)", "rgb(232 121 249)", "rgb(241 245 249)"]
                      : "rgb(241 245 249)",
                  backgroundColor:
                    i === 0
                      ? ["rgb(248 250 252)", "rgb(253 244 255)", "rgb(248 250 252)"]
                      : "rgb(248 250 252)",
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[12px] font-medium text-slate-700">{name}</span>
                <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-700">
                  {i === 0 ? "Hot" : i === 1 ? "Warm" : "Nurture"}
                </span>
              </motion.div>
            ),
          )}
        </div>

        <motion.div
          className="pointer-events-none absolute z-10"
          animate={{
            x: [24, 210, 210, 24],
            y: [78, 78, 118, 78],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <HiOutlineCursorArrowRays className="h-7 w-7 text-slate-800 drop-shadow" />
          <motion.span
            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-fuchsia-500"
            animate={{ scale: [1, 1.6, 1], opacity: [0.9, 0.2, 0.9] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function TypingOutreachCard() {
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const full = TYPE_LINES[lineIndex];
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(id);
        window.setTimeout(() => {
          setLineIndex((n) => (n + 1) % TYPE_LINES.length);
        }, 1400);
      }
    }, 28);
    return () => window.clearInterval(id);
  }, [lineIndex]);

  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border border-slate-200 bg-[#faf8fc] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
        Outreach
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[18px] font-semibold text-slate-900">
        Copy writes itself
      </h3>
      <p className="mt-1.5 text-[13px] text-slate-500">
        AI drafts the first line from score, reviews, and ad gaps — ready to send.
      </p>

      <div className="relative mt-5 h-[188px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <HiOutlineSparkles className="h-4 w-4 text-fuchsia-500" />
          Generating outreach…
        </div>
        <div className="min-h-[88px] rounded-xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50/80 to-violet-50/50 p-3">
          <p className="text-[13px] leading-relaxed text-slate-800">
            {typed}
            <motion.span
              className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] bg-fuchsia-500"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </p>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-[11px] text-slate-400"
          >
            Angle {lineIndex + 1} of {TYPE_LINES.length} · personalization on
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScoringCard() {
  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border border-slate-200 bg-[#faf8fc] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
        Qualification
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[18px] font-semibold text-slate-900">
        Scores fill in live
      </h3>
      <p className="mt-1.5 text-[13px] text-slate-500">
        Website, marketing, and fit scores animate as enrichment finishes.
      </p>

      <div className="relative mt-5 h-[188px] space-y-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
        {SCORE_STEPS.map((step, i) => (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-600">{step.label}</span>
              <motion.span
                className="font-semibold text-fuchsia-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.35, repeat: Infinity, repeatDelay: 2.4 }}
              >
                {step.value}
              </motion.span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                initial={{ width: "8%" }}
                animate={{ width: [`8%`, `${step.value}%`, `${step.value}%`, `8%`] }}
                transition={{
                  duration: 3.6,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        ))}
        <motion.div
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700"
          animate={{ opacity: [0.35, 1, 1, 0.35] }}
          transition={{ duration: 3.6, repeat: Infinity }}
        >
          Tier: Hot · Ready for outreach
        </motion.div>
      </div>
    </div>
  );
}

/** Three looping automation vignettes — replaces the heavy interactive shell. */
export function MarketingAutomationShowcase() {
  return (
    <section
      id="interactive-demo"
      className="relative overflow-hidden bg-[#ffffff] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      aria-label="Automation preview"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#faf8fc] to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <Reveal variant="up" y={18}>
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
              Automation in motion
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.35rem,3vw,2rem)] font-semibold tracking-tight text-slate-900">
              Watch the desk work itself
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-slate-500">
              Search, score, and outreach draft — looping previews of what the platform does before
              you ever open a spreadsheet.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          <Reveal delay={0.04}>
            <CursorSearchCard />
          </Reveal>
          <Reveal delay={0.1}>
            <TypingOutreachCard />
          </Reveal>
          <Reveal delay={0.16}>
            <ScoringCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
