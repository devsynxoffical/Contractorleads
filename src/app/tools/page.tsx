import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageSection } from "@/components/marketing/marketing-subpage";
import { JsonLd, breadcrumbJsonLd, collectionPageJsonLd } from "@/components/seo/json-ld";
import { FREE_TOOLS } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Cold Email & Lead Generation Tools for Agencies",
  description: "Free tools for agencies prospecting contractors: SPF, DKIM and DMARC checker, cold email subject line tester and lead cost calculator. No sign-up.",
  path: "/tools",
  keywords: ["free cold email tools", "free lead generation tools", "spf dkim dmarc checker", "subject line tester"],
});

export default function ToolsHub() {
  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Free tools", path: "/tools" },
          ]),
          collectionPageJsonLd({
            name: "Free tools",
            description: "Free cold email and lead generation tools.",
            path: "/tools",
            items: FREE_TOOLS.map((t) => ({ name: t.name, path: `/tools/${t.slug}` })),
          }),
        ]}
      />
      <MarketingSubpageHero
        eyebrow="Free tools"
        title="Free tools for prospecting contractors"
        description="Check your sending domain, test subject lines and work out what a lead is really worth. Every tool is free and works without signing up."
      />
      <SubpageSection tone="light" eyebrow="No sign-up" title="Pick a tool">
        <ul className="grid gap-4 md:grid-cols-3">
          {FREE_TOOLS.map((t) => (
            <li key={t.slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-[17px] font-bold text-slate-900">
                <Link href={`/tools/${t.slug}`} className="hover:text-fuchsia-700">
                  {t.name}
                </Link>
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{t.metaDescription}</p>
              <Link href={`/tools/${t.slug}`} className="mt-3 inline-block text-[14px] font-semibold text-fuchsia-700 hover:underline">
                Open the {t.name.toLowerCase()} →
              </Link>
            </li>
          ))}
        </ul>
      </SubpageSection>
      <SubpageSection tone="soft" eyebrow="Why these tools" title="Built for agencies that prospect contractors">
        <div className="mx-auto max-w-3xl space-y-4 text-[15.5px] leading-relaxed text-slate-700">
          <p>
            Cold outreach to contractors fails for three avoidable reasons: emails land in spam because the sending domain is not
            authenticated, subject lines look like mass marketing, and the offer is not framed in the contractor&apos;s own numbers.
            Each free tool here fixes one of those before you send.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Check SPF, DKIM, DMARC and MX on the domain you send from, with the exact record to add for anything missing.</li>
            <li>Test subject lines for length, spam-trigger words, capitals and a fake Re: before a campaign goes out.</li>
            <li>Show a contractor what their current lead source really costs per job won, and where a new channel breaks even.</li>
          </ul>
          <p>
            Every tool runs without an account and stores nothing you enter. When you are ready to find the contractors to email,{" "}
            <Link href="/locations" className="font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2">
              search by state
            </Link>{" "}
            or{" "}
            <Link href="/industries" className="font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2">
              by trade
            </Link>
            .
          </p>
        </div>
      </SubpageSection>
      <SubpageCtaBand
        title="Find contractor leads with verified emails"
        description="Search 18 trades by city or state, add owner names and verified emails, and export. Your first 10 leads are free."
        primaryLabel="Start free"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
