import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineGift,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineUserPlus,
  HiOutlineArrowTrendingUp,
  HiOutlineDevicePhoneMobile,
  HiOutlineClock,
} from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import {
  SubpageCard,
  SubpageCtaBand,
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
} from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { AffiliateEarningsCalculator } from "./calculator";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Leads Affiliate Program: 30% Recurring Commission",
  description:
    "Join the Contractor Leads Affiliate Program. Earn 30% recurring cash commission on every deal and ongoing subscription renewal. 30-day tracking cookie, $500 payout threshold.",
  path: "/affiliates",
  keywords: [
    "contractor leads affiliate program",
    "b2b saas affiliate program",
    "30 percent recurring commission affiliate",
    "lead generation affiliate program",
    "agency software affiliate partner",
  ],
});

const AFFILIATE_FAQS = [
  {
    q: "How does the Contractor Leads affiliate program work?",
    a: "When you join, you receive a unique referral link (e.g. contractorleads.us/ref/yourname). Share your link with marketing agencies, contractors, or your audience. When someone signs up through your link, their account is permanently attributed to you. Every time they purchase a plan or renew their monthly subscription, you earn 30% cash commission.",
  },
  {
    q: "What is the commission rate and are renewals included?",
    a: "We pay a generous 30% commission on every eligible sale, calculated on the applicable deal or package price. Unlike one-time affiliate programs, subscription renewals are fully included for the lifetime of the active customer.",
  },
  {
    q: "What is the minimum payout threshold?",
    a: "The minimum payout threshold is $500.00. Once your payable commission balance reaches $500, you can request a cash payout directly from your affiliate dashboard.",
  },
  {
    q: "Which payout methods are supported?",
    a: "We support PayPal (instant electronic payment), Direct Bank Wire / ACH transfer, and Wise. Payout requests are verified and disbursed promptly by our accounting team.",
  },
  {
    q: "How long is the tracking cookie window?",
    a: "Our referral cookie persists for 30 days. If someone clicks your referral link and registers an account anytime within 30 days, that customer is securely and permanently attributed to your affiliate account.",
  },
  {
    q: "Is it free to join?",
    a: "Yes, 100% free! There are no setup fees, no monthly costs, and no minimum audience requirements. Anyone can sign up, access their affiliate link immediately, and start earning.",
  },
];

export default function AffiliatesMarketingPage() {
  return (
    <MarketingSiteShell>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Affiliate Program", path: "/affiliates" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(AFFILIATE_FAQS)} />

      {/* Hero Section */}
      <MarketingSubpageHero
        eyebrow="Partner & Affiliate Program"
        title="Earn 30% Recurring Commission for Life"
        description="Partner with Contractor Leads. Refer contractors, marketing agencies, and media buyers to the #1 contractor prospecting software. Earn a generous 30% cash commission on every deal and ongoing monthly renewal."
      >
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur">
            <HiOutlineCheckCircle className="h-4 w-4" /> 30% Commission Rate
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur">
            <HiOutlineArrowTrendingUp className="h-4 w-4" /> Lifetime Subscription Renewals
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
            <HiOutlineBanknotes className="h-4 w-4" /> $500 Minimum Payout Threshold
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300 backdrop-blur">
            <HiOutlineClock className="h-4 w-4" /> 30-Day Cookie Attribution
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(217,70,239,0.35)] transition hover:from-fuchsia-400 hover:to-violet-500 hover:shadow-[0_14px_40px_rgba(217,70,239,0.45)]"
          >
            Join Affiliate Program Free
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login?redirect=/referrals"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Affiliate Portal Login
          </Link>
        </div>
      </MarketingSubpageHero>

      {/* Program Highlights Stats Band */}
      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: "30%", label: "Cash commission on all deals & renewals" },
            { value: "$500", label: "Minimum payout threshold" },
            { value: "30 Days", label: "Attribution tracking cookie" },
            { value: "$0", label: "Free to join · Instant link activation" },
          ]}
        />
      </SubpageSection>

      {/* Interactive Commission Earnings Calculator */}
      <SubpageSection
        tone="light"
        eyebrow="Earnings Calculator"
        title="Estimate Your Recurring Passive Income"
        description="See how fast your 30% recurring commissions add up each month as you refer agencies and contractors."
        align="center"
      >
        <AffiliateEarningsCalculator />
      </SubpageSection>

      {/* How It Works (3 Steps) */}
      <SubpageSection
        tone="tint"
        eyebrow="Simple 3-Step Process"
        title="How the Affiliate Program Works"
        description="Get set up in under 60 seconds with zero friction and start earning recurring commissions today."
        align="center"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <SubpageCard
            icon={<HiOutlineUserPlus className="h-5 w-5" />}
            title="1. Grab Your Unique Link"
            body="Sign up for free in 30 seconds. Your unique referral link (contractorleads.us/ref/yourname) and marketing assets are generated instantly inside your dashboard."
          />
          <SubpageCard
            icon={<HiOutlineUserGroup className="h-5 w-5" />}
            title="2. Share With Your Audience"
            body="Promote Contractor Leads to marketing agencies, roofing contractors, plumbers, HVAC owners, or cold emailers via social media, YouTube, newsletters, or direct recommendations."
          />
          <SubpageCard
            icon={<HiOutlineCurrencyDollar className="h-5 w-5" />}
            title="3. Earn 30% Recurring Cash"
            body="Receive 30% cash commission on every initial purchase and ongoing subscription renewal. Once your balance hits $500, request a direct payout via PayPal, Bank Wire, or Wise."
          />
        </div>
      </SubpageSection>

      {/* Why Promote Contractor Leads */}
      <SubpageSection
        tone="light"
        eyebrow="Partner Advantages"
        title="Why Affiliates Love Promoting Contractor Leads"
        description="We give you everything you need to convert traffic into long-term monthly recurring revenue."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SubpageCard
            icon={<HiOutlineSparkles className="h-5 w-5" />}
            title="High Conversion Rates"
            body="Every new visitor gets 10 free verified leads on Starter with zero credit card required. Free trials convert naturally into paid plans."
          />
          <SubpageCard
            icon={<HiOutlineArrowTrendingUp className="h-5 w-5" />}
            title="Lifetime Renewals Included"
            body="You don't just earn on the initial checkout. You receive 30% commission every billing cycle when your customer renews their subscription."
          />
          <SubpageCard
            icon={<HiOutlineClock className="h-5 w-5" />}
            title="30-Day Cookie Window"
            body="Our attribution cookie stays active in the prospect's browser for 30 full days, ensuring you get credited even if they purchase weeks later."
          />
          <SubpageCard
            icon={<HiOutlineDevicePhoneMobile className="h-5 w-5" />}
            title="Real-Time Partner Dashboard"
            body="Track your sign-ups, deal conversions, sales volume, commissions, and payout statuses in real-time with granular itemized reporting."
          />
          <SubpageCard
            icon={<HiOutlineBanknotes className="h-5 w-5" />}
            title="Reliable & Fast Payouts"
            body="Request your payout as soon as your payable commission balance hits $500. We disburse payouts via PayPal, ACH/Wire, or Wise."
          />
          <SubpageCard
            icon={<HiOutlineGift className="h-5 w-5" />}
            title="Milestone Cash Bonuses"
            body="Unlock cash reward bonuses when you hit milestone tiers (e.g. 10, 50, and 100+ paid customers) on top of your 30% commissions."
          />
        </div>
      </SubpageSection>

      {/* Commission Breakdown by Plan */}
      <SubpageSection
        tone="soft"
        eyebrow="Commission Structure"
        title="What You Earn Per Plan"
        description="Our simple, transparent 30% commission model applies across all packages and subscription renewals."
        align="center"
      >
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-ink-muted">
                <tr>
                  <th className="px-5 py-3.5">Plan / Package</th>
                  <th className="px-5 py-3.5">Package Price</th>
                  <th className="px-5 py-3.5">Commission Rate</th>
                  <th className="px-5 py-3.5">Monthly Commission</th>
                  <th className="px-5 py-3.5">Annual Value (Per User)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[13px]">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    Starter Plan
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-600 dark:text-ink-muted">
                    $19.00 / mo
                  </td>
                  <td className="px-5 py-4 font-semibold text-fuchsia-600">30%</td>
                  <td className="px-5 py-4 tabular-nums font-bold text-emerald-600">
                    $5.70 / mo
                  </td>
                  <td className="px-5 py-4 tabular-nums font-semibold text-slate-900 dark:text-white">
                    $68.40 / year
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    Growth Plan (Most Popular)
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-600 dark:text-ink-muted">
                    $49.00 / mo
                  </td>
                  <td className="px-5 py-4 font-semibold text-fuchsia-600">30%</td>
                  <td className="px-5 py-4 tabular-nums font-bold text-emerald-600">
                    $14.70 / mo
                  </td>
                  <td className="px-5 py-4 tabular-nums font-semibold text-slate-900 dark:text-white">
                    $176.40 / year
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    Agency Plan
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-600 dark:text-ink-muted">
                    $99.00 / mo
                  </td>
                  <td className="px-5 py-4 font-semibold text-fuchsia-600">30%</td>
                  <td className="px-5 py-4 tabular-nums font-bold text-emerald-600">
                    $29.70 / mo
                  </td>
                  <td className="px-5 py-4 tabular-nums font-semibold text-slate-900 dark:text-white">
                    $356.40 / year
                  </td>
                </tr>
                <tr className="bg-fuchsia-50/40 hover:bg-fuchsia-50/60 dark:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/15">
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                    Agency Annual Deal
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-600 dark:text-ink-muted">
                    $790.00 / yr
                  </td>
                  <td className="px-5 py-4 font-semibold text-fuchsia-600">30%</td>
                  <td className="px-5 py-4 tabular-nums font-bold text-emerald-600">
                    $237.00 (Lump sum)
                  </td>
                  <td className="px-5 py-4 tabular-nums font-bold text-emerald-600">
                    $237.00 / conversion
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-slate-50/40 p-4 text-center text-xs text-slate-500 dark:bg-white/5 dark:text-ink-muted">
            Plus milestone cash bonuses unlocked at 10, 50, and 100+ paying referrals.
          </div>
        </div>
      </SubpageSection>

      {/* Who is this for */}
      <SubpageSection
        tone="tint"
        eyebrow="Target Audience"
        title="Who Should Partner With Us?"
        description="Anyone with an audience of contractors, B2B agencies, lead generation pros, or sales teams."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SubpageCard
            title="Marketing Agencies & Coaches"
            body="Help your coaching students and agency clients prospect home service trades faster while generating reliable monthly recurring revenue."
          />
          <SubpageCard
            title="YouTubers & Creators"
            body="Review Contractor Leads, share lead generation tutorials, and earn high-ticket commissions from your video descriptions and links."
          />
          <SubpageCard
            title="Software Reviewers & Bloggers"
            body="Write comparisons, 'Best Contractor Lead Tools' roundups, and alternatives to Apollo or ZoomInfo that rank on Google."
          />
          <SubpageCard
            title="Contractor Trade Groups"
            body="Introduce your contractor community to verified home-service intelligence and earn passive income for your association or group."
          />
        </div>
      </SubpageSection>

      {/* FAQ Section */}
      <SubpageSection
        tone="light"
        eyebrow="Common Questions"
        title="Frequently Asked Questions"
        description="Everything you need to know about promoting Contractor Leads and collecting commissions."
        align="center"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {AFFILIATE_FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-violet-100 bg-white p-5 text-left shadow-sm transition hover:border-fuchsia-300 open:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900 dark:text-white">
                <span className="text-[15px]">{faq.q}</span>
                <span className="ml-2 text-fuchsia-600 transition group-open:rotate-180">
                  ↓
                </span>
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600 dark:text-white/70">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </SubpageSection>

      {/* Cosmic Final CTA Band */}
      <SubpageCtaBand
        title="Ready to Start Earning 30% Recurring Commissions?"
        description="Create your account, grab your unique referral link, and start earning passive recurring revenue in less than 2 minutes."
        primaryHref="/register"
        primaryLabel="Join the Affiliate Program"
        secondaryHref="/login?redirect=/referrals"
        secondaryLabel="Affiliate Portal Login"
        note="Instant approval · $500 minimum payout · Payouts via PayPal, Wire & Wise"
      />
    </MarketingSiteShell>
  );
}
