import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import { FOUNDER } from "@/components/marketing/footer-founder-card";
import { JsonLd, breadcrumbJsonLd, organizationJsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa6";

export const metadata: Metadata = buildMetadata({
  title: "About — contractor lead intelligence for agencies",
  description:
    "Contractor Leads helps marketing agencies and sales teams find verified, AI-scored home-service contractors — real contact data, not brokered lists.",
  path: "/about",
});

const VALUES = [
  {
    title: "The problem we solve",
    body: "Stale CSVs, guessed phone numbers, and five browser tabs do not scale a contractor outreach desk. Agencies need live Google data, owner names worth calling, and scores that change which leads get dialed first.",
  },
  {
    title: "What we believe",
    body: "Blank beats wrong. If we cannot verify a LinkedIn or email, we leave it empty. Delivery metrics and pipeline stages belong in the same product that found the lead — not a second spreadsheet.",
  },
  {
    title: "Who we build for",
    body: "Marketing agencies, media buyers, and closers selling into home-service trades — roofers, HVAC, plumbers, landscapers, and more. Not homeowners looking for a contractor.",
  },
];

export default function AboutPage() {
  return (
    <MarketingSiteShell>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <MarketingSubpageHero
        eyebrow="About"
        title="Built for agencies that sell to contractors"
        description="We are not a homeowner marketplace. Contractor Leads is prospecting software for agencies and operators who need live, verified home-service businesses — with the contact, the score, and the pitch angle."
      />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-[#faf8fc] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-violet-200/80 bg-[#3D1078] shadow-[0_16px_48px_rgba(124,58,237,0.25)] sm:h-48 sm:w-48">
            <Image
              src={FOUNDER.imageSrc}
              alt={FOUNDER.imageAlt}
              fill
              sizes="192px"
              className="object-cover object-[center_22%]"
              priority
            />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
              Founder
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-slate-900">
              {FOUNDER.name}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              {FOUNDER.bio} Contractor Leads exists so your team spends time
              closing — not copying numbers from Google Maps into a spreadsheet.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={FOUNDER.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <FaFacebookF className="h-3.5 w-3.5" />
              </a>
              <a
                href={FOUNDER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <FaLinkedinIn className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
          Contact
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          Questions about fit, partnerships, or enterprise seats:{" "}
          <a
            href={`mailto:${EMAIL_BRAND.contactEmail}`}
            className="font-semibold text-fuchsia-700 hover:underline"
          >
            {EMAIL_BRAND.contactEmail}
          </a>
        </p>
        <p className="mt-2 text-[14px] text-slate-500">{EMAIL_BRAND.address}</p>
        <Link
          href="/register"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(168,85,247,0.35)] transition hover:brightness-105"
        >
          Get started free
        </Link>
      </section>
    </MarketingSiteShell>
  );
}
