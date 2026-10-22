import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineEnvelope, HiOutlineShieldCheck, HiOutlineSparkles } from "react-icons/hi2";
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
import { JsonLd, breadcrumbJsonLd, organizationJsonLd, personJsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa6";

export const metadata: Metadata = buildMetadata({
  title: "About Contractor Leads: AI Lead Intelligence for Agencies",
  description:
    "Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams that sell to home-service contractors. Founded by Vaishali Kapoor.",
  path: "/about",
  keywords: [
    "about contractor leads",
    "contractor leads founder",
    "Vaishali Kapoor contractor leads",
    "Vaishali Media Productions LLC",
    "contractor prospecting software company",
  ],
});

export default function AboutPage() {
  return (
    <MarketingSiteShell>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={personJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <MarketingSubpageHero
        eyebrow="Company & Mission"
        title="About Contractor Leads"
        description="Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams that sell to home-service contractors: it finds businesses from live Google data, scores them Hot, Warm or Nurture, adds owner names and Meta ad status, and writes the outreach."
      >
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur">
          <HiOutlineShieldCheck className="h-4 w-4 text-fuchsia-300" />
          We are built for marketing agencies — not a homeowner marketplace.
        </div>
      </MarketingSubpageHero>

      {/* Stats Band */}
      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: `${INDUSTRIES.length}`, label: "Home-service trades" },
            {
              value: `${TIER_ONE_COUNTRIES.length}`,
              label: "Countries covered",
            },
            { value: "Live", label: "Google Places data at search time" },
            { value: "4", label: "AI scores on every lead" },
          ]}
        />
      </SubpageSection>

      {/* Why Contractor Leads exists */}
      <SubpageSection
        tone="light"
        eyebrow="Our Convictions"
        title="Why Contractor Leads exists"
        description="We built this platform to replace the outdated, high-friction tools that waste agency time."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal delay={0.05}>
            <SubpageCard
              title="The problem we solve"
              body="Stale CSVs, guessed phone numbers, and five browser tabs do not scale an agency outreach desk. Agencies need live Google data, owner names worth calling, and scores that change which leads get dialed first."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <SubpageCard
              title="Our core belief: blank beats wrong"
              body="If we cannot verify an owner's contact or LinkedIn profile with high confidence, we leave it empty rather than selling you fictitious hallucinations. Clean data preserves sender reputation and closing velocity."
            />
          </Reveal>
          <Reveal delay={0.15}>
            <SubpageCard
              title="Built for agencies, not homeowners"
              body="We do not sell shared leads to homeowners looking for repairs. We build intelligence tools for marketing agencies, media buyers, and sales teams that sell high-ticket services to commercial and residential contractors."
            />
          </Reveal>
        </div>
      </SubpageSection>

      {/* What the product does */}
      <SubpageSection
        tone="soft"
        eyebrow="Capabilities"
        title="What the product does"
        description="A full-cycle prospecting and outreach engine in one workspace."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Lead Finder</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Live Google Places search across 18 trades and 5 countries, filterable by city, radius, or ZIP.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">AI Lead Scoring</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              0–100 Website, PPC, and SEO opportunity scores categorized into Hot, Warm, and Nurture tiers.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Owner Enrichment</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Decision-maker names identified from company websites and verifiable business records.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Meta Ads Intel</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Instant Facebook and Instagram ad status verification before you make your first pitch.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Outreach Studio</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Cold email, SMS, and telephone opening scripts tailored to each lead&apos;s specific scores.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Pipeline CRM</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Visual pipeline tracking from New to Contacted, Meeting Booked, and Retainer Closed.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Lead Map HUD</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Geographic visualizer displaying contractor density and competitive saturation by market.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-[15px]">Integrations</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Direct webhooks and sync for GoHighLevel, HubSpot, Zapier, Make, Slack, and Excel export.
            </p>
          </div>
        </div>
      </SubpageSection>

      {/* Where our data comes from */}
      <SubpageSection
        tone="light"
        eyebrow="Data Integrity"
        title="Where our data comes from"
        description="Fresh, verifiable intelligence queried at the exact moment you search."
      >
        <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-8 space-y-4 text-[15px] leading-relaxed text-slate-700">
          <p>
            Every business record in Contractor Leads is retrieved live from Google Places, cross-referenced with
            Yelp and the contractor&apos;s active website. We analyze page speed, mobile performance, Google Business
            Profile review volume, and Meta ad activity at search time.
          </p>
          <p>
            <strong>What we never do:</strong> We never buy stale list dumps from third-party brokerages, we never
            recycle dead contacts from months prior, and we never guess executive names or email addresses.
          </p>
        </div>
      </SubpageSection>

      {/* Founder Section */}
      <section className="border-y border-slate-200/80 bg-[#faf8fc] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-violet-200/80 bg-[#3D1078] shadow-[0_16px_48px_rgba(124,58,237,0.25)] sm:h-52 sm:w-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FOUNDER.imageSrc}
              alt={FOUNDER.imageAlt}
              width={208}
              height={208}
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
              {FOUNDER.bio} Contractor Leads exists so your sales development reps and agency closers spend
              their days closing high-ticket retainers—not copying phone numbers from Google Maps into spreadsheets.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={FOUNDER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition hover:border-fuchsia-300 hover:text-fuchsia-700"
              >
                <FaLinkedinIn className="h-4 w-4 text-[#0A66C2]" />
                Connect on LinkedIn
              </a>
              <a
                href="https://www.youtube.com/@contractorleads"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube Channel"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition hover:border-fuchsia-300 hover:text-fuchsia-700"
              >
                Contractor Leads YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Company details & Contact */}
      <SubpageSection
        tone="light"
        align="center"
        eyebrow="Company Details"
        title="Corporate & Legal Entity"
        description="Contractor Leads is developed and operated by Vaishali Media Productions LLC."
      >
        <Reveal className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 to-violet-100 text-fuchsia-700">
              <HiOutlineEnvelope className="h-6 w-6" />
            </span>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
              Vaishali Media Productions LLC
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              30 N Gould St # 58138, Sheridan, WY 82801, USA
            </p>
            <a
              href={`mailto:${EMAIL_BRAND.contactEmail}`}
              className="mt-3 block font-semibold text-fuchsia-700 hover:underline text-[15px]"
            >
              {EMAIL_BRAND.contactEmail}
            </a>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/enterprise/book"
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-[#faf8fc] px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-fuchsia-300"
              >
                Book an enterprise demo
                <HiOutlineArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-95"
              >
                See pricing plans
              </Link>
            </div>
          </div>
        </Reveal>
      </SubpageSection>

      <SubpageCtaBand
        title="Start prospecting contractor leads today"
        description="Pick a trade, pick a city, and watch Contractor Leads score live businesses in seconds. 10 free leads."
        primaryLabel="Start free trial (10 leads)"
        secondaryHref="/features"
        secondaryLabel="See all features"
        note="No credit card required · Starter starts at $19/mo"
      />
    </MarketingSiteShell>
  );
}
