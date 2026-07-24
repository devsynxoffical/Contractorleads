"use client";

import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Fixed top bar — scroll progress across the marketing page */
export function MarketingScrollProgress() {
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });
  const opacity = useTransform(smooth, [0, 0.02, 1], [0, 1, 1]);

  if (reduced) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left shadow-[0_0_12px_rgba(236,72,153,0.45)]"
      style={{ scaleX: smooth, opacity, background: LOGO_GRADIENT }}
      aria-hidden
    />
  );
}

export function MarketingStickyCta() {
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.1);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 sm:block"
      initial={false}
      animate={
        visible
          ? { y: 0, opacity: 1, scale: 1 }
          : { y: 24, opacity: 0, scale: 0.96, pointerEvents: "none" }
      }
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 28 }
      }
    >
      <Link
        href="/register"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#ffffff]/95 px-5 py-2.5 text-[13px] font-semibold text-slate-800 shadow-[0_12px_40px_rgba(80,40,120,0.18)] backdrop-blur-xl transition hover:shadow-[0_16px_48px_rgba(217,70,239,0.22)]"
      >
        <motion.span
          className="h-2 w-2 rounded-full"
          style={{ background: LOGO_GRADIENT }}
          animate={reduced ? undefined : { scale: [1, 1.35, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        Start free — 10 leads included
        <span
          className="rounded-full px-2 py-0.5 text-[11px] text-white"
          style={{ background: LOGO_GRADIENT }}
        >
          Go
        </span>
      </Link>
    </motion.div>
  );
}

export function MarketingNavLinks({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const links = [
    ["Features", "#features"],
    ["Technology", "#technology"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ] as const;

  return (
    <div className={cn("flex items-center gap-6 text-[13px] font-medium text-slate-500", className)}>
      {links.map(([label, href], i) => (
        <motion.a
          key={href}
          href={href}
          onClick={onNavigate}
          className="relative transition hover:text-slate-900"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -1 }}
        >
          {label}
        </motion.a>
      ))}
    </div>
  );
}

export function FinalCtaActions() {
  const reduced = usePrefersReducedMotion();
  const items = [
    { type: "link" as const, href: "/register", primary: true, label: "Get started free" },
    { type: "link" as const, href: "/login", primary: false, label: "Sign in" },
  ];

  return (
    <motion.div
      className="mt-8 flex flex-wrap items-center justify-center gap-3"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : 0.1 } },
      }}
    >
      {items.map((item) => (
        <motion.div
          key={item.href}
          variants={{
            hidden: { opacity: 0, y: 16, scale: 0.98 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {item.primary ? (
            <Link
              href={item.href}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#ffffff] px-7 py-4 text-[15px] font-semibold text-violet-700 shadow-xl transition hover:bg-fuchsia-50"
            >
              {item.label} <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={item.href}
              className="rounded-2xl border border-white/40 bg-white/10 px-6 py-4 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              {item.label}
            </Link>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function FooterReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
