"use client";

import { motion } from "framer-motion";
import { Glass, TiltCard } from "./marketing-ui";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

const LEADS = [
  { name: "Summit Roofing Co", tier: "Hot", score: 92, city: "Austin, TX" },
  { name: "Arctic Air HVAC", tier: "Warm", score: 74, city: "Phoenix, AZ" },
  { name: "Vista Plumbing", tier: "Hot", score: 88, city: "Denver, CO" },
];

export function FloatingDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-5xl [perspective:1400px]">
      <TiltCard intensity={8} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 18 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 12 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative origin-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <Glass className="overflow-hidden p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: LOGO_GRADIENT }}
                />
                <span className="text-[12px] font-semibold text-ink">
                  LeadFlow Console
                </span>
              </div>
              <div className="flex gap-1.5">
                {["Live", "AI", "Map"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400"
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
                      className="rounded-2xl border border-border bg-[var(--input-bg)] p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                        {s.l}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink">
                        {s.v}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-[var(--input-bg)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-ink">
                      Pipeline quality
                    </p>
                    <p className="text-[11px] text-ink-faint">7 days</p>
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
                    className="rounded-2xl border border-border bg-[var(--panel-solid)] p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">
                          {lead.name}
                        </p>
                        <p className="text-[11px] text-ink-faint">{lead.city}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          lead.tier === "Hot"
                            ? "bg-pink-500/15 text-pink-300"
                            : "bg-violet-500/15 text-violet-300"
                        }`}
                      >
                        {lead.tier}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-brand-50">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: LOGO_GRADIENT }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${lead.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-[11px] font-medium text-ink-muted">
                      Score {lead.score}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Glass>

          {/* Floating notification */}
          <motion.div
            className="absolute -right-2 top-8 z-10 hidden w-56 sm:block lg:-right-6"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
            viewport={{ once: true }}
            transition={{
              opacity: { delay: 0.6 },
              scale: { delay: 0.6 },
              y: { delay: 0.6, duration: 3.2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Glass className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                New lead
              </p>
              <p className="mt-1 text-[13px] font-semibold text-ink">
                Elite Electric LLC
              </p>
              <p className="text-[11px] text-ink-muted">Score 91 · Hot · Miami</p>
            </Glass>
          </motion.div>

          <motion.div
            className="absolute -left-3 bottom-10 z-10 hidden w-48 sm:block lg:-left-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.75 }}
          >
            <Glass className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                AI insight
              </p>
              <p className="mt-1 text-[12px] leading-snug text-ink-muted">
                PPC opportunity high — no website ads detected.
              </p>
            </Glass>
          </motion.div>
        </motion.div>
      </TiltCard>
    </div>
  );
}
