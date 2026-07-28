"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { MarketingScrollProgress } from "./marketing-motion";
import { MarketingMobileNav } from "./marketing-mobile-nav";
import { MarketingAuthActions } from "./marketing-auth-actions";
import { MarketingSiteFooter } from "./marketing-site-footer";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/trades", label: "Trades" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

/** Shared marketing chrome — matches homepage header/footer styling. */
export function MarketingSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-site relative min-h-screen bg-[#ffffff] text-slate-900">
      <MarketingScrollProgress />
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#ffffff]/90 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Contractor Leads"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full"
              priority
            />
            <span className="truncate font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-slate-900 max-[360px]:hidden">
              Contractor <span className="gradient-text">Leads</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-slate-500 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <MarketingAuthActions variant="scroll" />
            <MarketingMobileNav />
          </div>
        </div>
      </header>

      <main>{children}</main>
      <MarketingSiteFooter />
    </div>
  );
}

export function MarketingSubpageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#07040f] py-16 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(168,85,247,0.35), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        {eyebrow ? (
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/65">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
