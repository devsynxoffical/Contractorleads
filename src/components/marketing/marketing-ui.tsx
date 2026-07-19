"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  type MotionValue,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({
  children,
  className,
  intensity = 10,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 180,
    damping: 18,
  });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 180,
    damping: 18,
  });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={cn("relative transform-gpu", className)}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      mv.set(value * eased);
      raf = requestAnimationFrame(tick);
      if (p >= 1) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, mv]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function InfiniteMarquee({
  children,
  speed = 40,
  reverse = false,
  className,
}: {
  children: ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="flex w-max gap-10"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0 gap-10">{children}</div>
        <div className="flex shrink-0 gap-10" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function Glass({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_0_1px_rgba(217,70,239,0.08),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function GradientBorder({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-[28px] p-px", className)}
      style={{ background: LOGO_GRADIENT }}
    >
      <div className="rounded-[27px] bg-[var(--canvas)]">{children}</div>
    </div>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-brand-400">
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.2vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-ink",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function AuroraBlob({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full opacity-50 blur-[100px]",
        className,
      )}
      style={{ background: LOGO_GRADIENT, ...style }}
      aria-hidden
    />
  );
}

export function useMouseParallax(strength = 20) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      x.set(nx * strength);
      y.set(ny * strength);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [strength, x, y]);

  return { x: sx, y: sy };
}

export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      x.set(e.clientX - 200);
      y.set(e.clientY - 200);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed z-[5] hidden h-[400px] w-[400px] rounded-full opacity-30 mix-blend-screen lg:block"
      style={{
        x,
        y,
        background:
          "radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(168,85,247,0.12) 40%, transparent 70%)",
      }}
    />
  );
}

export type ScrollProgress = MotionValue<number>;
