import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageSection } from "@/components/marketing/marketing-subpage";
import { JsonLd, breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd } from "@/components/seo/json-ld";
import { LOCATION_STATES } from "@/lib/locations";
import { buildMetadata } from "@/lib/seo";
import { getStateProfile } from "@/lib/state-profiles";

export const metadata: Metadata = buildMetadata({
  title: "Find Contractor Leads by State: All 50 US States",
  description: "Find contractor leads in every US state: roofers, HVAC, plumbers and 15 more trades with owner names and verified emails. Start with 10 free leads.",
  path: "/locations",
  keywords: ["find contractor leads by state", "contractor leads by state", "list of contractors by state"],
});

const FAQS = [
  {
    q: "Can I find contractor leads in any US state?",
    a: "Yes. Contractor Leads searches live Google business data in all 50 states, and you can narrow any search to a city, county or radius. Each state page shows which trades have the strongest demand there and the largest markets to start with.",
  },
  {
    q: "Do you have offices in these states?",
    a: "No. Contractor Leads is software: the data comes from live Google business listings and public sources, so it covers every state without local offices. The state pages are guides to each market, not office locations.",
  },
  {
    q: "Is the price different by state?",
    a: "No. The first 10 leads are free, then plans start at $19.99 a month for 500 leads in any state, with owner names, verified emails and AI scores included.",
  },
];

export default function LocationsHub() {
  const divisions = new Map<string, typeof LOCATION_STATES>();
  for (const s of LOCATION_STATES) {
    const d = getStateProfile(s.code)?.division ?? "Other";
    divisions.set(d, [...(divisions.get(d) ?? []), s]);
  }
  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Locations", path: "/locations" },
          ]),
          collectionPageJsonLd({
            name: "Find contractor leads by state",
            description: "Contractor lead guides for all 50 US states.",
            path: "/locations",
            items: LOCATION_STATES.map((s) => ({ name: `Contractor leads in ${s.name}`, path: `/locations/${s.slug}` })),
          }),
          faqPageJsonLd(FAQS, "/locations"),
        ]}
      />
      <MarketingSubpageHero
        eyebrow="Locations"
        title="Find contractor leads by state"
        description="Pick a state to see which trades have the strongest demand, the largest markets to search first and when to reach out."
      />
      <SubpageSection tone="light" eyebrow="All 50 states" title="Choose a state">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...divisions.entries()].map(([division, states]) => (
            <div key={division}>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">{division}</h2>
              <ul className="mt-2 space-y-1.5">
                {states.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/locations/${s.slug}`} className="text-[15px] font-semibold text-fuchsia-700 hover:underline">
                      Contractor leads in {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SubpageSection>
      <SubpageSection tone="soft" eyebrow="FAQ" title="Finding contractor leads by state">
        <dl className="mx-auto max-w-3xl divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-6">
          {FAQS.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </SubpageSection>
      <SubpageCtaBand
        title="Find contractor leads in any state"
        description="Search any trade and city, add owner names and verified emails, and export. Your first 10 leads are free."
        primaryLabel="Start free"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
