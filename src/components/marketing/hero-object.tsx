"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "./marketing-motion";

/**
 * Hero centrepiece: a rendered glass knot (pink -> violet -> blue light) on a
 * black plate. The outer wrapper uses `mix-blend-mode: screen` so the black
 * vanishes over the dark hero and only the glowing object remains. The blend
 * must live on the outermost, untransformed element: transforms create their
 * own stacking context and would otherwise isolate the blend from the page.
 *
 * Motion: slow float, idle rotation, pointer parallax with spring, pulsing
 * halo, a spinning conic light ring and orbiting glow particles. Everything
 * stops under prefers-reduced-motion.
 */
const HERO_OBJECT_SRC = "/marketing/hero-knot.jpg";

const ORBITS = [
  { size: "118%", duration: 22, delay: 0, dot: "#f0abfc", tilt: 62 },
  { size: "136%", duration: 31, delay: -9, dot: "#93c5fd", tilt: 70 },
  { size: "104%", duration: 17, delay: -4, dot: "#e879f9", tilt: 58 },
];

export function HeroObject({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 0.6 });
  const rotateX = useTransform(sy, [-1, 1], [9, -9]);
  const rotateY = useTransform(sx, [-1, 1], [-12, 12]);
  const shiftX = useTransform(sx, [-1, 1], [-16, 16]);
  const shiftY = useTransform(sy, [-1, 1], [-12, 12]);

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
      className={`hero-object relative aspect-square w-full ${className}`}
      style={{ perspective: 1200, mixBlendMode: "screen" }}
      data-reduced={reduced ? "true" : "false"}
      aria-hidden
    >
      {/* Pulsing halo */}
      <motion.div
        className="absolute inset-[12%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(217,70,239,0.6) 0%, rgba(124,58,237,0.42) 40%, rgba(56,189,248,0.2) 62%, transparent 74%)",
        }}
        animate={reduced ? undefined : { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Spinning conic light ring */}
      <div className="hero-ring pointer-events-none absolute inset-[2%] rounded-full" />

      {/* Orbiting particles on tilted rings */}
      {ORBITS.map((o, i) => (
        <div
          key={i}
          className="hero-orbit pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/[0.05]"
          style={{
            ["--tilt" as string]: `${o.tilt}deg`,
            width: o.size,
            height: o.size,
            transform: `translate(-50%, -50%) rotateX(${o.tilt}deg)`,
            animationDuration: `${o.duration}s`,
            animationDelay: `${o.delay}s`,
          }}
        >
          <span
            className="hero-orbit-dot absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: o.dot,
              boxShadow: `0 0 12px 3px ${o.dot}`,
              animationDuration: `${o.duration}s`,
              animationDelay: `${o.delay}s`,
            }}
          />
        </div>
      ))}

      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformStyle: "preserve-3d" }}
      >
        <motion.img
          src={HERO_OBJECT_SRC}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-contain"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={
            reduced
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: [1, 1.035, 1], y: [0, -16, 0], rotate: [0, 3, 0, -3, 0] }
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

      {/* Specular sweep */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-[10%] rounded-full"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
          }}
          animate={{ x: ["-30%", "30%", "-30%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
