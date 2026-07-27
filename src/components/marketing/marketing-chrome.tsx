import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { SEO } from "@/lib/seo";
import { MarketingAuthActions } from "@/components/marketing/marketing-auth-actions";
import { FooterFounderCard } from "@/components/marketing/footer-founder-card";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/trades", label: "Trades" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

const SOCIAL = [
  { href: SEO.social.linkedin, label: "LinkedIn" },
  { href: SEO.social.instagram, label: "Instagram" },
  { href: SEO.social.tiktok, label: "TikTok" },
  { href: SEO.social.x, label: "X" },
];

export function MarketingChrome({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#faf8fc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-violet-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Contractor Leads"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-[family-name:var(--font-display)] text-[15px] font-bold tracking-tight text-slate-900">
              Contractor Leads
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-semibold text-slate-600 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-fuchsia-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <MarketingAuthActions variant="chrome" />
        </div>
      </header>

      <main>{children}</main>

      {!bare ? (
        <footer className="border-t border-violet-100 bg-[#0c0820] text-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-8 px-5 py-14 sm:px-8 md:grid-cols-4 md:items-start">
            <div className="col-span-2 md:col-span-1">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold">
                Contractor Leads
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                Verified contractor leads for agencies selling into home-service
                trades.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                Product
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-white/70">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                Account
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-white/70">
                <li>
                  <Link href="/register" className="hover:text-white">
                    Start free trial
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Sign in
                  </Link>
                </li>
              </ul>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                Legal
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-white/70">
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                Social
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-white/70">
                {SOCIAL.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-2 md:col-start-3">
              <FooterFounderCard />
            </div>
          </div>
          <div className="mx-auto max-w-6xl border-t border-white/10 px-5 py-4 text-center text-[12px] text-white/40 sm:px-8">
            © {new Date().getFullYear()} Contractor Leads. All rights reserved.
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export function MarketingHero({
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
    <section className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-b from-[#fdf2f8] via-[#fae8ff]/50 to-[#faf8fc] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        {eyebrow ? (
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
