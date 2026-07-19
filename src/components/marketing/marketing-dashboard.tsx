"use client";

import { motion } from "framer-motion";
import { TiltCard } from "./marketing-ui";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

const LEADS = [
  { name: "Summit Roofing Co", tier: "Hot", score: 92, city: "Austin, TX" },
  { name: "Arctic Air HVAC", tier: "Warm", score: 74, city: "Phoenix, AZ" },
  { name: "Vista Plumbing", tier: "Hot", score: 88, city: "Denver, CO" },
];

/** Always-dark product mock — reads cleanly on white hero sections */
export function FloatingDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-5xl [perspective:1400px]">
      <TiltCard intensity={8} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 18 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 10 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative origin-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#12081f] p-3 shadow-[0_30px_80px_rgba(80,40,120,0.35)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: LOGO_GRADIENT }}
                />
                <span className="text-[12px] font-semibold text-white">
                  LeadFlow Console
                </span>
              </div>
              <div className="flex gap-1.5">
                {["Live", "AI", "Map"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Hot leads", v: "128" },
                    { l: "Avg score", v: "81" },
                    { l: "Reply rate", v: "34%" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="rounded-2xl border border-white/10 bg-[#1a102c] p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-white/45">
                        {s.l}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold text-white">
                        {s.v}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1a102c] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-white">
                      Pipeline quality
                    </p>
                    <p className="text-[11px] text-white/40">7 days</p>
                  </div>
                  <div className="flex h-28 items-end gap-1.5">
                    {[40, 55, 48, 70, 62, 88, 76].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t-md"
                        style={{ background: LOGO_GRADIENT }}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.7,
                          delay: 0.15 + i * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {LEADS.map((lead, i) => (
                  <motion.div
                    key={lead.name}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="rounded-2xl border border-white/10 bg-[#160e28] p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-white">
                          {lead.name}
                        </p>
                        <p className="text-[11px] text-white/45">{lead.city}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          lead.tier === "Hot"
                            ? "bg-pink-500/20 text-pink-300"
                            : "bg-violet-500/20 text-violet-300"
                        }`}
                      >
                        {lead.tier}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: LOGO_GRADIENT }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${lead.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-[11px] font-medium text-white/55">
                      Score {lead.score}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            className="absolute -right-2 top-8 z-10 hidden w-56 sm:block lg:-right-6"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
            viewport={{ once: true }}
            transition={{
              opacity: { delay: 0.6 },
              scale: { delay: 0.6 },
              y: {
                delay: 0.6,
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <div className="rounded-2xl border border-white/15 bg-[#1a102c]/95 p-3 shadow-xl backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
                New lead
              </p>
              <p className="mt-1 text-[13px] font-semibold text-white">
                Elite Electric LLC
              </p>
              <p className="text-[11px] text-white/55">Score 91 · Hot · Miami</p>
            </div>
          </motion.div>

          <motion.div
            className="absolute -left-3 bottom-10 z-10 hidden w-48 sm:block lg:-left-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.75 }}
          >
            <div className="rounded-2xl border border-white/15 bg-[#1a102c]/95 p-3 shadow-xl backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
                AI insight
              </p>
              <p className="mt-1 text-[12px] leading-snug text-white/70">
                PPC opportunity high — no website ads detected.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </TiltCard>
    </div>
  );
}
