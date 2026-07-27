"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineCreditCard } from "react-icons/hi2";
import { cn } from "@/lib/utils";
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

/** Visible for 3s, then hidden ~10s before the next one. */
const SHOW_MS = 3000;
const GAP_MS = 10000;

function pickNext(excludeId?: string): FakePurchase {
  const candidates = excludeId
    ? POOL.filter((_, i) => `p-${i}` !== excludeId)
    : POOL;
  const idx = Math.floor(Math.random() * candidates.length);
  const row = candidates[idx] ?? POOL[0];
  const poolIndex = POOL.indexOf(row);
  return { ...row, id: `p-${poolIndex}-${Date.now()}` };
}

/**
 * Live-feeling purchase feed for marketing (simulated social proof).
 */
export function FooterLivePurchases({
  floating = false,
}: {
  /** When true, show as a persistent site overlay instead of footer block. */
  floating?: boolean;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const [event, setEvent] = useState<FakePurchase | null>(null);
  const [visible, setVisible] = useState(true);

  const textCard = floating ? "text-slate-700/90" : "text-white/90";
  const whoText = floating ? "text-slate-900" : "text-white";
  const metaText = floating ? "text-slate-500/70" : "text-white/40";
  const actionText = floating ? "text-slate-500/60" : "text-white/50";

  useEffect(() => {
    if (reduceMotion) {
      setEvent(pickNext());
      setVisible(true);
      return;
    }

    let hideTimer: number | undefined;
    let gapTimer: number | undefined;

    function showNext() {
      setEvent((prev) => pickNext(prev?.id));
      setVisible(true);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
        gapTimer = window.setTimeout(showNext, GAP_MS);
      }, SHOW_MS);
    }

    showNext();

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      if (gapTimer) window.clearTimeout(gapTimer);
    };
  }, [reduceMotion]);

  const copy = useMemo(() => {
    if (!event) return null;
    return {
      who: `${event.firstName} in ${event.city}, ${event.state}`,
      plan: event.plan,
    };
  }, [event]);

  if (!copy) return null;
  if (floating && !visible) return null;

  return (
    <div
      className={cn(
        "max-w-xl",
        floating
          ? "pointer-events-none fixed bottom-4 left-3 z-50 mb-0 w-[calc(100vw-1.5rem)] sm:bottom-5 sm:left-5 sm:w-auto"
          : "mb-8",
      )}
    >
      <div className="min-h-[4.75rem]">
        <AnimatePresence mode="wait">
          {visible && (
            <motion.div
              key={event?.id ?? "idle"}
              initial={
                reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, y: -8, filter: "blur(4px)" }
              }
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex w-full max-w-md items-start gap-4 rounded-2xl px-4 py-3.5 backdrop-blur-md sm:px-5 sm:py-4",
                floating
                  ? "border border-slate-200/70 bg-white/85 shadow-[0_12px_40px_rgba(2,6,23,0.12)]"
                  : "border border-white/12 bg-white/[0.07] shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
              )}
            >
              <span
                className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.35)]"
                aria-hidden
              >
                <HiOutlineCreditCard className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1 space-y-1.5">
                <p className={cn("text-[13px] leading-snug sm:text-[14px]", textCard)}>
                  <span className={cn("font-semibold", whoText)}>{copy.who}</span>
                  <span className={cn(actionText)}> {event?.action} </span>
                  <span className={`font-semibold ${PLAN_ACCENT[copy.plan]}`}>
                    {copy.plan}
                  </span>
                  <span className={cn(actionText)}> plan</span>
                </p>
                <p className={cn("text-[11px]", metaText)}>Just now</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
