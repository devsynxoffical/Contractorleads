"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiOutlineArrowRight, HiOutlineChevronRight } from "react-icons/hi2";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { SEO } from "@/lib/seo";
import { subscribeMarketingEmail } from "@/lib/client/marketing-track";

const NAV_PRIMARY: Array<[string, string]> = [
  ["Home", "/"],
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["Industries", "/industries"],
  ["Blog", "/blog"],
  ["Help Center", "/help"],
  ["About", "/about"],
];

const NAV_SECONDARY: Array<[string, string]> = [
  ["Lead Gen Software", "/contractor-lead-generation-software"],
  ["Google Maps Scraper", "/google-maps-scraper"],
  ["Apollo Alternative", "/apollo-alternative"],
  ["Compare Alternatives", "/alternatives"],
  ["Affiliate Program", "/affiliates"],
  ["Enterprise", "/enterprise/book"],
  ["Privacy Policy", "/privacy"],
  ["Terms of Service", "/terms"],
];

const SOCIAL: Array<[string, string]> = [
  ["LinkedIn", SEO.social.linkedin],
  ["YouTube", SEO.social.youtube],
  ["Facebook", SEO.social.facebook],
  ["Email", `mailto:${EMAIL_BRAND.contactEmail}`],
];

/** Live clock in the company's time zone (Sheridan, Wyoming = Mountain Time). */
function LocalClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Denver",
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <p
      className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.2vw,2.4rem)] font-semibold tabular-nums tracking-tight text-slate-900"
      aria-live="off"
    >
      {now || "00:00:00"}
    </p>
  );
}

function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v) {
      setError("Enter your work email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await subscribeMarketingEmail({ email: v, source: "footer", emailOptIn: true });
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-tight text-slate-900">
        Stay in the loop
      </h3>
      <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-slate-600">
        Outreach playbooks, scoring updates and new trade guides, about twice a month.
      </p>
      <p className="mt-3 text-[12px] text-slate-500">We respect your inbox. No spam, unsubscribe anytime.</p>
      {done ? (
        <p className="mt-6 text-[14px] font-semibold text-emerald-700">You are on the list.</p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6">
          <label htmlFor="footer-email" className="sr-only">
            Work email
          </label>
          <div className="flex items-center gap-2 border-b border-slate-300 pb-2 focus-within:border-fuchsia-500">
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label="Subscribe"
              className="flex h-8 w-8 items-center justify-center rounded-full text-fuchsia-600 transition hover:bg-fuchsia-50 disabled:opacity-50"
            >
              <HiOutlineArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-[12px] text-red-600">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

/** Arpeggio-style footer: oversized wordmark, local time, link grid, newsletter, social list. */
export function MarketingSiteFooter() {
  return (
    <footer className="relative border-t border-slate-200 bg-white text-slate-900">
      {/* Wordmark row */}
      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 pt-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:pt-20">
        <div className="min-w-0">
          <p
            aria-hidden
            className="select-none bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 bg-clip-text font-[family-name:var(--font-display)] text-[clamp(2.4rem,7.4vw,6.8rem)] font-bold leading-[0.92] tracking-[-0.05em] text-transparent"
          >
            Contractor Leads
            <sup className="ml-1 align-top text-[0.18em] font-semibold text-fuchsia-600">®</sup>
          </p>
          <p className="mt-4 text-right font-[family-name:var(--font-display)] text-[clamp(1.1rem,1.9vw,1.6rem)] font-medium leading-tight tracking-tight text-slate-500 lg:mt-2">
            Lead intelligence for agencies —
          </p>
        </div>
        <div className="lg:min-w-[300px]">
          <p className="flex items-start gap-2 text-[clamp(1.05rem,1.6vw,1.35rem)] font-medium leading-snug text-slate-900">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-fuchsia-600" aria-hidden />
            We are based in Sheridan, Wyoming and work remotely.
          </p>
          <div className="mt-4">
            <LocalClock />
            <p className="mt-1 text-[13px] text-slate-500">Mountain Time (America/Denver)</p>
          </div>
        </div>
      </div>

      {/* Link grid */}
      <div className="border-t border-slate-200">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.2fr_1fr_0.8fr]">
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-3 px-5 py-10 sm:px-8 lg:border-r lg:border-slate-200"
          >
            <ul className="space-y-3">
              {NAV_PRIMARY.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex flex-col text-[17px] font-medium text-slate-800 transition hover:text-fuchsia-700"
                  >
                    {label}
                    <span className="mt-0.5 h-px w-5 bg-fuchsia-500/70 transition-all group-hover:w-full" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-3">
              {NAV_SECONDARY.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex flex-col text-[17px] font-medium text-slate-800 transition hover:text-fuchsia-700"
                  >
                    {label}
                    <span className="mt-0.5 h-px w-5 bg-fuchsia-500/70 transition-all group-hover:w-full" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-slate-200 bg-[#f7f5fa] px-5 py-10 sm:px-8 lg:border-t-0 lg:border-r lg:border-slate-200">
            <FooterNewsletter />
          </div>

          <ul className="border-t border-slate-200 lg:border-t-0">
            {SOCIAL.map(([label, href]) => {
              const external = href.startsWith("http");
              return (
                <li key={label} className="border-b border-slate-200 last:border-b-0">
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="group flex items-center justify-between px-5 py-5 text-[17px] font-medium text-slate-800 transition hover:bg-fuchsia-50/60 hover:text-fuchsia-700 sm:px-8"
                  >
                    {label}
                    <HiOutlineChevronRight className="h-4 w-4 text-fuchsia-600 transition group-hover:translate-x-0.5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Legal row */}
      <div className="border-t border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-[13px] text-slate-600 sm:px-8 lg:grid-cols-[1.2fr_1fr_0.8fr] lg:gap-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:border-r lg:border-slate-200 lg:pr-8">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Registered office</p>
              <p className="mt-1">
                <strong className="text-slate-900">Vaishali Media Productions LLC</strong>
                <br />
                {EMAIL_BRAND.address}
              </p>
              <a
                href={`mailto:${EMAIL_BRAND.contactEmail}`}
                className="mt-3 inline-block font-[family-name:var(--font-display)] text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-tight text-slate-900 hover:text-fuchsia-700"
              >
                {EMAIL_BRAND.contactEmail}
              </a>
            </div>
            <p className="leading-relaxed">
              Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams
              that sell to home-service contractors. It is not a marketplace for homeowners.
            </p>
          </div>
          <div className="lg:border-r lg:border-slate-200 lg:px-8">
            <p>© {new Date().getFullYear()} Contractor Leads. All rights reserved.</p>
            <p className="mt-2 text-slate-500">Built for agencies that sell to contractors.</p>
          </div>
          <div className="flex items-center lg:justify-center">
            <Image src="/logo.png" alt="Contractor Leads" width={36} height={36} className="rounded-full" />
          </div>
        </div>
      </div>
    </footer>
  );
}
