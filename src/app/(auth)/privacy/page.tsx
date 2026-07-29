import type { Metadata } from "next";
import Link from "next/link";
import { AuthSiteFooter, AuthSiteHeader } from "@/components/auth/auth-chrome";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for Contractor Leads — how we collect, use, and protect agency account and usage data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="marketing-site flex min-h-[100dvh] flex-col bg-[#ffffff] text-slate-900">
      <AuthSiteHeader mode="login" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
          Legal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: July 25, 2026
        </p>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-slate-600">
          <p>
            Contractor Leads (&quot;we&quot;) respects your privacy. This policy
            describes what we collect and how we use it when you visit
            contractorleads.us or use the product.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Information we collect
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Account details you provide (name, business email, phone, company
              profile).
            </li>
            <li>
              Billing information processed by Stripe (we do not store full card
              numbers).
            </li>
            <li>
              Product usage (searches, saved leads, exports) needed to operate
              the Service.
            </li>
            <li>
              Basic technical logs (IP, browser) for security and reliability.
            </li>
          </ul>
          <h2 className="text-lg font-semibold text-slate-900">How we use it</h2>
          <p>
            We use this data to run the product, send transactional email
            (verification, password reset, receipts), improve features, and
            prevent abuse. We do not sell your account data.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Lead data
          </h2>
          <p>
            Business lead records come from public and licensed data sources.
            Customers are responsible for lawful use of that data in their
            outreach.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Your choices</h2>
          <p>
            You can update profile settings in-app, unsubscribe from marketing
            mail via email links, and request account deletion by contacting
            support.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p>
            Privacy questions:{" "}
            <a
              href="mailto:hello@contractorleads.us"
              className="font-semibold text-fuchsia-600"
            >
              hello@contractorleads.us
            </a>
            . See also our{" "}
            <Link href="/terms" className="font-semibold text-fuchsia-600">
              Terms of Service
            </Link>
            .
          </p>
          <p className="text-slate-500">{EMAIL_BRAND.address}</p>
        </div>
      </main>
      <AuthSiteFooter />
    </div>
  );
}
