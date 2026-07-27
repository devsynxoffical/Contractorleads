import type { Metadata } from "next";
import Link from "next/link";
import { AuthSiteFooter, AuthSiteHeader } from "@/components/auth/auth-chrome";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Terms of Service for Contractor Leads — the agency platform for verified contractor lead generation.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#ffffff] text-slate-900">
      <AuthSiteHeader mode="login" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
          Legal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: July 25, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-5 text-[15px] leading-relaxed text-slate-600">
          <p>
            By creating an account or using Contractor Leads (&quot;the
            Service&quot;), you agree to these Terms. If you do not agree, do
            not use the Service.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
          <p>
            You must provide accurate business information and keep your login
            credentials secure. You are responsible for activity under your
            account. We may suspend accounts that abuse the platform, scrape
            beyond plan limits, or violate these Terms.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Plans & billing</h2>
          <p>
            Paid plans are billed through Stripe. Credits, feature access, and
            renewals follow the plan you select. Fees are generally
            non-refundable except where required by law or stated otherwise.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2>
          <p>
            Use lead data only for lawful B2B outreach. Do not spam, harass, or
            violate TCPA/CAN-SPAM or similar laws. Do not attempt to probe,
            overload, or reverse-engineer the Service.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Data</h2>
          <p>
            Lead and enrichment data is provided as-is from third-party sources.
            Accuracy is not guaranteed. Our{" "}
            <Link href="/privacy" className="font-semibold text-fuchsia-600">
              Privacy Policy
            </Link>{" "}
            explains how we handle personal data.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p>
            Questions:{" "}
            <a
              href="mailto:hello@contractorleads.us"
              className="font-semibold text-fuchsia-600"
            >
              hello@contractorleads.us
            </a>
          </p>
          <p className="text-slate-500">{EMAIL_BRAND.address}</p>
        </div>
      </main>
      <AuthSiteFooter />
    </div>
  );
}
