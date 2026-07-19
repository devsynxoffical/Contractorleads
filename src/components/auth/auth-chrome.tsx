"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

const FOOTER_COLUMNS = [
  {
    h: "Product",
    links: [
      ["Features", "/#features"],
      ["Technology", "/#technology"],
      ["Lead Finder", "/register"],
      ["AI Assistant", "/#features"],
      ["Pricing", "/#pricing"],
      ["Integrations", "/#features"],
      ["FAQ", "/#faq"],
      ["Start free", "/register"],
    ],
  },
  {
    h: "Company",
    links: [
      ["About", "/"],
      ["Sign in", "/login"],
      ["Register", "/register"],
      ["Help", "/#faq"],
      ["Contact", "mailto:hello@contractorleads.us"],
      ["Security", "/"],
    ],
  },
  {
    h: "Social",
    links: [
      ["Instagram", "#"],
      ["LinkedIn", "#"],
      ["TikTok", "#"],
      ["X", "#"],
      ["YouTube", "#"],
    ],
  },
  {
    h: "Legal",
    links: [
      ["Privacy Policy", "#"],
      ["Terms of Service", "#"],
      ["Cookie Notice", "#"],
      ["Acceptable Use", "#"],
    ],
  },
] as const;

export function AuthSiteHeader({
  mode = "login",
}: {
  mode?: "login" | "register";
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#ffffff]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" priority />
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-slate-900">
            Contractor <span className="gradient-text">Leads</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] font-medium text-slate-500 md:flex">
          <Link href="/#features" className="transition hover:text-slate-900">
            Features
          </Link>
          <Link href="/#technology" className="transition hover:text-slate-900">
            Technology
          </Link>
          <Link href="/#pricing" className="transition hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/#faq" className="transition hover:text-slate-900">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={`hidden rounded-xl px-3 py-2 text-[13px] font-medium transition sm:inline ${
              mode === "login"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
            style={{ background: LOGO_GRADIENT }}
          >
            {mode === "register" ? "Start free" : "Start free"}{" "}
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Gamma-style footer with giant CONTRACTOR watermark — same as marketing */
export function AuthSiteFooter() {
  return (
    <footer className="marketing-gamma-footer relative isolate overflow-hidden">
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(88,28,135,0.45), transparent 55%), linear-gradient(180deg, #07060f 0%, #0c0820 42%, #120a28 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 85% 25%, rgba(255,255,255,0.3), transparent)",
          backgroundSize: "120px 120px, 180px 180px, 90px 90px, 150px 150px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-[min(90%,720px)] -translate-x-1/2 opacity-60 blur-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(236,72,153,0.55), rgba(168,85,247,0.35), transparent)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[100vw] overflow-hidden pt-16 sm:pt-20">
        <p
          aria-hidden
          className="marketing-footer-wordmark select-none text-center font-[family-name:var(--font-display)] font-bold uppercase leading-none tracking-[-0.06em]"
        >
          CONTRACTOR
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl border-t border-white/10 px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="text-[13px] font-semibold text-white">Get started</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffffff] px-4 py-2.5 text-[12px] font-semibold text-neutral-900 transition hover:bg-fuchsia-50"
              >
                Start for free
                <HiOutlineArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="text-[12px] font-medium text-white/55">
                Contractor Leads
              </span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.h}>
              <p className="text-[13px] font-semibold text-white">{col.h}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[13px] text-white/55 transition hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Contractor Leads. All rights reserved.</p>
          <p className="text-white/30">Built for agencies that sell to contractors.</p>
        </div>
      </div>
    </footer>
  );
}
