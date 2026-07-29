"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { CloudDecor, SparklesDecor } from "./marketing-decor";
import { Reveal } from "./marketing-ui";

/**
 * Section kit that gives marketing subpages the homepage's banding rhythm.
 * Tones mirror the homepage palette so subpages alternate the same way.
 */
export type SectionTone = "light" | "tint" | "soft" | "dark";

const TONE_BG: Record<SectionTone, string> = {
  light: "bg-[#ffffff]",
  tint: "bg-[#f6f7f9]",
  soft: "bg-[#faf8fb]",
  dark: "bg-[#07040f]",
};

const TONE_BORDER: Record<SectionTone, string> = {
  light: "border-slate-100",
  tint: "border-slate-200/70",
  soft: "border-slate-200/70",
  dark: "border-white/10",
};

export function SubpageSection({
  id,
  tone = "light",
  eyebrow,
  title,
  description,
  align = "left",
  decor = false,
  children,
}: {
  id?: string;
  tone?: SectionTone;
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
  decor?: boolean;
  children?: ReactNode;
}) {
  const dark = tone === "dark";
  const centered = align === "center";
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`relative overflow-hidden border-b ${TONE_BORDER[tone]} ${TONE_BG[tone]} py-14 sm:py-20`}
    >
      {dark ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(168,85,247,0.30), transparent 60%)",
          }}
          aria-hidden
        />
      ) : null}
      {decor && !dark ? <CloudDecor side="right" className="opacity-40" /> : null}

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        {eyebrow || title || description ? (
          <Reveal
            className={
              centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
            }
          >
            {eyebrow ? (
              <p
                className={`text-[12px] font-semibold uppercase tracking-[0.2em] ${
                  dark ? "text-fuchsia-300" : "text-fuchsia-600"
                }`}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                id={headingId}
                className={`mt-2 font-[family-name:var(--font-display)] text-[clamp(1.45rem,2.9vw,2.1rem)] font-semibold tracking-tight ${
                  dark ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                className={`mt-3 text-[15px] leading-relaxed ${
                  dark ? "text-white/65" : "text-slate-600"
                }`}
              >
                {description}
              </p>
            ) : null}
          </Reveal>
        ) : null}

        {children ? (
          <div className={eyebrow || title || description ? "mt-8" : ""}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Card matching the homepage feature-grid cards. */
export function SubpageCard({
  icon,
  title,
  body,
  tone = "light",
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  tone?: SectionTone;
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <article
      className={`h-full rounded-2xl border p-5 transition ${
        dark
          ? "border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-white/20"
          : "border-violet-100 bg-white shadow-sm hover:border-fuchsia-300 hover:shadow-md"
      } ${className}`}
    >
      {icon ? (
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            dark
              ? "bg-white/[0.06] text-fuchsia-300"
              : "bg-gradient-to-br from-fuchsia-100 to-violet-100 text-fuchsia-700"
          }`}
        >
          {icon}
        </span>
      ) : null}
      <h3
        className={`font-[family-name:var(--font-display)] text-[17px] font-semibold ${
          icon ? "mt-4" : ""
        } ${dark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </h3>
      <p
        className={`mt-2 text-[14px] leading-relaxed ${
          dark ? "text-white/60" : "text-slate-600"
        }`}
      >
        {body}
      </p>
    </article>
  );
}

/** Gradient closer band — same treatment as the homepage final CTA. */
export function SubpageCtaBand({
  title,
  description,
  primaryHref = "/register",
  primaryLabel = "Get started free",
  secondaryHref,
  secondaryLabel,
  note,
}: {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  note?: string;
}) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #ec4899 0%, #d946ef 40%, #7c3aed 100%)",
        }}
        aria-hidden
      />
      <CloudDecor className="opacity-30 mix-blend-soft-light" />
      <SparklesDecor className="text-white/70" />
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.6vw,2.5rem)] font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/80">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:bg-fuchsia-50"
            >
              {primaryLabel}
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex rounded-full border border-white/40 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
          {note ? (
            <p className="mt-5 text-[12px] text-white/75">{note}</p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
