"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "./marketing-motion";

type FakePurchase = {
  id: string;
  firstName: string;
  city: string;
  state: string;
  plan: "Starter" | "Growth" | "Agency" | "Enterprise";
  action: "purchased" | "upgraded to" | "subscribed to";
};

const POOL: Omit<FakePurchase, "id">[] = [
  { firstName: "Marcus", city: "Austin", state: "TX", plan: "Agency", action: "purchased" },
  { firstName: "Priya", city: "Denver", state: "CO", plan: "Growth", action: "upgraded to" },
  { firstName: "Jordan", city: "Phoenix", state: "AZ", plan: "Starter", action: "subscribed to" },
  { firstName: "Elena", city: "Miami", state: "FL", plan: "Agency", action: "purchased" },
  { firstName: "Chris", city: "Seattle", state: "WA", plan: "Growth", action: "purchased" },
  { firstName: "Aisha", city: "Atlanta", state: "GA", plan: "Agency", action: "upgraded to" },
  { firstName: "Noah", city: "Chicago", state: "IL", plan: "Starter", action: "purchased" },
  { firstName: "Sofia", city: "San Diego", state: "CA", plan: "Growth", action: "subscribed to" },
  { firstName: "Liam", city: "Dallas", state: "TX", plan: "Enterprise", action: "purchased" },
  { firstName: "Maya", city: "Nashville", state: "TN", plan: "Agency", action: "upgraded to" },
  { firstName: "Owen", city: "Portland", state: "OR", plan: "Growth", action: "purchased" },
  { firstName: "Hannah", city: "Charlotte", state: "NC", plan: "Starter", action: "subscribed to" },
  { firstName: "Diego", city: "Houston", state: "TX", plan: "Agency", action: "purchased" },
  { firstName: "Grace", city: "Boston", state: "MA", plan: "Growth", action: "upgraded to" },
  { firstName: "Ryan", city: "Tampa", state: "FL", plan: "Agency", action: "purchased" },
  { firstName: "Zoe", city: "Minneapolis", state: "MN", plan: "Starter", action: "purchased" },
  { firstName: "Ethan", city: "Las Vegas", state: "NV", plan: "Growth", action: "subscribed to" },
  { firstName: "Ava", city: "Raleigh", state: "NC", plan: "Agency", action: "upgraded to" },
];

const PLAN_ACCENT: Record<FakePurchase["plan"], string> = {
  Starter: "text-sky-300",
  Growth: "text-emerald-300",
  Agency: "text-fuchsia-300",
  Enterprise: "text-amber-300",
};

function pickNext(excludeId?: string): FakePurchase {
  const candidates = excludeId
    ? POOL.filter((_, i) => `p-${i}` !== excludeId)
    : POOL;
  const idx = Math.floor(Math.random() * candidates.length);
  const row = candidates[idx] ?? POOL[0];
  const poolIndex = POOL.indexOf(row);
  return { ...row, id: `p-${poolIndex}-${Date.now()}` };
}

function relativeLabel(secondsAgo: number) {
  if (secondsAgo < 45) return "Just now";
  if (secondsAgo < 120) return "1 min ago";
  return `${Math.floor(secondsAgo / 60)} min ago`;
}

/**
 * Live-feeling purchase feed for the marketing footer (simulated social proof).
 */
export function FooterLivePurchases() {
  const reduceMotion = usePrefersReducedMotion();
  const [event, setEvent] = useState<FakePurchase | null>(null);
  const [ageSec, setAgeSec] = useState(12);
  const [visible, setVisible] = useState(true);

  // Stable first paint + rotate
  useEffect(() => {
    setEvent(pickNext());
    setAgeSec(8 + Math.floor(Math.random() * 40));

    if (reduceMotion) return;

    const rotate = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setEvent((prev) => pickNext(prev?.id));
        setAgeSec(5 + Math.floor(Math.random() * 55));
        setVisible(true);
      }, 320);
    }, 4800);

    const ageTick = window.setInterval(() => {
      setAgeSec((s) => s + 1);
    }, 1000);

    return () => {
      window.clearInterval(rotate);
      window.clearInterval(ageTick);
    };
  }, [reduceMotion]);

  const copy = useMemo(() => {
    if (!event) return null;
    return {
      who: `${event.firstName} in ${event.city}, ${event.state}`,
      plan: event.plan,
      when: relativeLabel(ageSec),
    };
  }, [event, ageSec]);

  if (!copy) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live activity
      </div>

      <div className="mt-3 min-h-[3.25rem]">
        <AnimatePresence mode="wait">
          {visible && (
            <motion.div
              key={event?.id ?? "idle"}
              initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 backdrop-blur-md"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/80 to-violet-600/80 text-[12px] font-bold text-white"
                aria-hidden
              >
                {event?.firstName.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] text-white/90">
                  <span className="font-semibold text-white">{copy.who}</span>{" "}
                  <span className="text-white/55">{event?.action}</span>{" "}
                  <span className={`font-semibold ${PLAN_ACCENT[copy.plan]}`}>
                    {copy.plan}
                  </span>
                  <span className="text-white/55"> plan</span>
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">{copy.when}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
