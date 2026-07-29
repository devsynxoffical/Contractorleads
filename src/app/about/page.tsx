import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineEnvelope } from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import { FOUNDER } from "@/lib/founder";
import {
  SubpageCard,
  SubpageCtaBand,
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
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

      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: `${INDUSTRIES.length}`, label: "Home-service verticals" },
            {
              value: `${TIER_ONE_COUNTRIES.length}`,
              label: "Countries you can prospect",
            },
            { value: "Live", label: "Google & Yelp data at search time" },
            { value: "4", label: "AI scores on every lead" },
          ]}
        />
      </SubpageSection>

      <SubpageSection
        tone="light"
        align="center"
        eyebrow="What drives us"
        title="Why Contractor Leads exists"
        description="Three convictions shape every decision we make about the product."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((item, i) => (
            <Reveal key={item.title} delay={0.06 * i}>
              <SubpageCard title={item.title} body={item.body} />
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <section className="border-y border-slate-200/80 bg-[#faf8fc] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-violet-200/80 bg-[#3D1078] shadow-[0_16px_48px_rgba(124,58,237,0.25)] sm:h-48 sm:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FOUNDER.imageSrc}
              alt={FOUNDER.imageAlt}
              width={192}
              height={192}
              className="h-full w-full object-cover object-[center_18%]"
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

      <SubpageSection
        tone="light"
        align="center"
        eyebrow="Contact"
        title="Talk to us"
        description="Questions about fit, partnerships, or enterprise seats — we answer every message."
      >
        <Reveal className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 to-violet-100 text-fuchsia-700">
              <HiOutlineEnvelope className="h-6 w-6" />
            </span>
            <a
              href={`mailto:${EMAIL_BRAND.contactEmail}`}
              className="mt-4 block font-[family-name:var(--font-display)] text-[18px] font-semibold text-fuchsia-700 hover:underline"
            >
              {EMAIL_BRAND.contactEmail}
            </a>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
              {EMAIL_BRAND.address}
            </p>
            <Link
              href="/enterprise/book"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-[#faf8fc] px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-fuchsia-300"
            >
              Book an enterprise call
              <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </SubpageSection>

      <SubpageCtaBand
        title="See it on your own market"
        description="Pick a trade, pick a city, and watch Contractor Leads score live businesses in seconds."
        primaryLabel="Get started free"
        secondaryHref="/features"
        secondaryLabel="See all features"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
