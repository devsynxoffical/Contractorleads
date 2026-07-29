"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { FooterReveal } from "./marketing-motion";
import { FooterFounderCard } from "./footer-founder-card";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { SEO } from "@/lib/seo";

const columns = [
  {
    h: "Product",
    links: [
      ["Features", "/features"],
      ["Pricing", "/pricing"],
      ["Industries", "/industries"],
      ["Blog", "/blog"],
      ["FAQs", "/#faq"],
    ],
  },
  {
    h: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "mailto:hello@contractorleads.us"],
    ],
  },
  {
    h: "Social",
    links: [
      ["LinkedIn", SEO.social.linkedin],
      ["Facebook", SEO.social.facebook],
    ],
  },
  {
    h: "Legal",
    links: [
      ["Privacy Policy", "/privacy"],
      ["Terms of Service", "/terms"],
    ],
  },
];

/** Homepage-style gamma footer — shared across marketing subpages. */
export function MarketingSiteFooter() {
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
        <FooterReveal>
          <motion.p
            aria-hidden
            className="marketing-footer-wordmark select-none text-center font-[family-name:var(--font-display)] font-bold uppercase leading-none tracking-[-0.06em]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            CONTRACTOR LEADS
          </motion.p>
        </FooterReveal>
      </div>

      <div className="relative mx-auto max-w-6xl border-t border-white/10 px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-5 lg:items-start">
          <FooterReveal delay={0.05}>
            <div>
              <p className="text-[13px] font-semibold text-white">Get started</p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffffff] px-4 py-2.5 text-[12px] font-semibold text-neutral-900 transition hover:bg-fuchsia-50"
                >
                  Get started free
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
          </FooterReveal>

          {columns.map((col, ci) => (
            <FooterReveal key={col.h} delay={0.08 + ci * 0.05}>
              <div>
                <p className="text-[13px] font-semibold text-white">{col.h}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, href]) => {
                    const external = href.startsWith("http");
                    return (
                      <li key={label}>
                        <a
                          href={href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="text-[13px] text-white/55 transition hover:text-white"
                        >
                          {label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </FooterReveal>
          ))}

          <FooterReveal delay={0.2} className="col-span-2 sm:col-span-3 lg:col-span-2 lg:col-start-4">
            <FooterFounderCard />
          </FooterReveal>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Contractor Leads. All rights reserved.</p>
            <p className="text-white/30">{EMAIL_BRAND.address}</p>
          </div>
          <p className="text-white/30">Built for agencies that sell to contractors.</p>
        </div>
      </div>
    </footer>
  );
}
