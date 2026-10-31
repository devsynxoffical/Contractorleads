"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "./marketing-motion";

/**
 * Hero centrepiece: a rendered glass knot (pink -> violet -> blue light) on a
 * black plate. The whole wrapper uses `mix-blend-mode: screen` so the black
 * vanishes over the dark hero and only the glowing object remains. The blend
 * must live on the outermost, untransformed element: transforms create their
 * own stacking context and would otherwise isolate the blend from the page.
 *
 * Motion: slow vertical float, a few degrees of idle rotation, pointer
 * parallax, and a pulsing glow underneath. All of it stops under
 * prefers-reduced-motion.
 *
 * Asset: /public/marketing/hero-knot.jpg (1024x1024 render on black).
 */
const HERO_OBJECT_SRC = "/marketing/hero-knot.jpg";

export function HeroObject({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 0.6 });
  const rotateX = useTransform(sy, [-1, 1], [8, -8]);
  const rotateY = useTransform(sx, [-1, 1], [-10, 10]);
  const shiftX = useTransform(sx, [-1, 1], [-14, 14]);
  const shiftY = useTransform(sy, [-1, 1], [-10, 10]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      mx.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2))));
      my.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2))));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduced]);

  return (
    <div
      ref={ref}
      className={`relative aspect-square w-full ${className}`}
      style={{ perspective: 1200, mixBlendMode: "screen" }}
      aria-hidden
    >
      {/* Pulsing halo behind the object */}
      <motion.div
        className="absolute inset-[14%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(217,70,239,0.55) 0%, rgba(124,58,237,0.38) 40%, rgba(56,189,248,0.18) 62%, transparent 74%)",
        }}
        animate={reduced ? undefined : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Thin orbit ring for depth */}
      <div className="pointer-events-none absolute inset-[3%] rounded-full border border-white/[0.06]" />
      <div className="pointer-events-none absolute inset-[-6%] rounded-full border border-white/[0.035]" />

      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformStyle: "preserve-3d" }}
      >
        <motion.img
          src={HERO_OBJECT_SRC}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-contain"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={
            reduced
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: [1, 1.03, 1], y: [0, -14, 0], rotate: [0, 2.5, 0, -2.5, 0] }
          }
          transition={
            reduced
              ? { duration: 0.8 }
              : {
                  opacity: { duration: 1.1, ease: "easeOut" },
                  scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 14, repeat: Infinity, ease: "easeInOut" },
                }
          }
        />
      </motion.div>

      {/* Specular sweep: a soft light band drifting across the object */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-[10%] rounded-full"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.10) 50%, transparent 60%)",
            mixBlendMode: "screen",
          }}
          animate={{ x: ["-30%", "30%", "-30%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
