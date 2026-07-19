"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

/** Distinct Unsplash visuals — not the marketing cloud assets */
export const AUTH_PHOTOS = {
  login:
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80",
  register:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80",
} as const;

/** Soft mesh + floating orbs — theme-matched, no cloud PNGs */
export function AuthMeshBackdrop({ variant }: { variant: "login" | "register" }) {
  const pinkBias = variant === "login";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: pinkBias
            ? "linear-gradient(155deg, #fff 0%, #fdf2f8 42%, #f5f3ff 78%, #ffffff 100%)"
            : "linear-gradient(155deg, #fff 0%, #f5f3ff 38%, #fdf2f8 72%, #ffffff 100%)",
        }}
      />
      <motion.div
        className="absolute -left-24 top-16 h-72 w-72 rounded-full blur-[90px]"
        style={{ background: pinkBias ? "rgba(244,114,182,0.45)" : "rgba(167,139,250,0.4)" }}
        animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-16 bottom-24 h-80 w-80 rounded-full blur-[100px]"
        style={{ background: pinkBias ? "rgba(139,92,246,0.38)" : "rgba(236,72,153,0.35)" }}
        animate={{ x: [0, -16, 0], y: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full blur-[70px]"
        style={{ background: "rgba(217,70,239,0.22)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Fine geometric grid — professional, not playful clouds */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 70% at 40% 40%, black, transparent)",
        }}
      />
    </div>
  );
}

export function AuthBrandPanel({
  variant,
  title,
  subtitle,
  features,
}: {
  variant: "login" | "register";
  title: string;
  subtitle: string;
  features: { label: string; detail: string }[];
}) {
  const photo = AUTH_PHOTOS[variant];
  const stats =
    variant === "login"
      ? [
          { n: "12k+", l: "Leads scored" },
          { n: "34%", l: "Reply lift" },
          { n: "4.9", l: "Agency rating" },
        ]
      : [
          { n: "20", l: "Free credits" },
          { n: "0$", l: "Card required" },
          { n: "Tier‑1", l: "Markets" },
        ];

  return (
    <div className="relative flex h-full min-h-full flex-col overflow-hidden border-r border-slate-200/80">
      <AuthMeshBackdrop variant={variant} />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-16 lg:px-14 xl:px-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
          {variant === "login" ? "Welcome back" : "Get started"}
        </p>
        <h2 className="mt-3 max-w-md font-[family-name:var(--font-display)] text-[clamp(2rem,3.2vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-500">{subtitle}</p>

        <div className="relative mt-10 aspect-[16/10] w-full max-w-lg overflow-hidden rounded-[24px] shadow-[0_24px_60px_rgba(100,60,160,0.18)] ring-1 ring-white/80">
          <Image
            src={photo}
            alt={variant === "login" ? "Agency workspace" : "Growth team collaborating"}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 0px, 560px"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                variant === "login"
                  ? "linear-gradient(135deg, rgba(236,72,153,0.35), transparent 50%, rgba(124,58,237,0.4))"
                  : "linear-gradient(160deg, rgba(124,58,237,0.4), transparent 45%, rgba(236,72,153,0.35))",
            }}
          />
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            {stats.map((s) => (
              <div
                key={s.l}
                className="flex-1 rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 backdrop-blur-md"
              >
                <p className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-white">
                  {s.n}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/75">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-10 space-y-4">
          {features.map((f, i) => (
            <li key={f.label} className="flex gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white shadow-md shadow-fuchsia-500/25"
                style={{ background: LOGO_GRADIENT }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{f.label}</p>
                <p className="text-[13px] text-slate-500">{f.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
