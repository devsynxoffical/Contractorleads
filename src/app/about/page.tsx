import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
import { JsonLd, breadcrumbJsonLd, organizationJsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { EMAIL_BRAND } from "@/lib/email-brand";

export const metadata: Metadata = buildMetadata({
  title: "About — contractor lead intelligence for agencies",
  description:
    "Contractor Leads helps marketing agencies and sales teams find verified, AI-scored home-service contractors — real contact data, not brokered lists.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <MarketingChrome>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <MarketingHero
        eyebrow="About"
        title="Built for agencies that sell to contractors"
        description="We are not a homeowner marketplace. Contractor Leads is prospecting software for agencies, media buyers, and closers who need live, verified home-service businesses — with the contact, the score, and the pitch angle."
      />

      <section className="mx-auto max-w-3xl space-y-8 px-5 py-16 text-[15px] leading-relaxed text-slate-600 sm:px-8">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            The problem we solve
          </h2>
          <p className="mt-3">
            Stale CSVs, guessed phone numbers, and five browser tabs do not scale
            a contractor outreach desk. Agencies need live Google data, owner
            names worth calling, and scores that change which leads get dialed
            first.
          </p>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            What we believe
          </h2>
          <p className="mt-3">
            Blank beats wrong. If we cannot verify a LinkedIn or email, we leave
            it empty. Delivery metrics and pipeline stages belong in the same
            product that found the lead — not a second spreadsheet.
          </p>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            Contact
          </h2>
          <p className="mt-3">
            Questions about fit, partnerships, or enterprise seats:{" "}
            <a
              href={`mailto:${EMAIL_BRAND.contactEmail}`}
              className="font-semibold text-fuchsia-700 hover:underline"
            >
              {EMAIL_BRAND.contactEmail}
            </a>
          </p>
          <p className="mt-3 text-slate-500">{EMAIL_BRAND.address}</p>
        </div>
        <Link
          href="/register"
          className="inline-flex rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          Start free trial
        </Link>
      </section>
    </MarketingChrome>
  );
}
