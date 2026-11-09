import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowRight, HiOutlineCheck } from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageLinkGrid, SubpageSection } from "@/components/marketing/marketing-subpage";
import { LinkedText, createLinkBudget, stripLinkMarkup } from "@/components/blog/linked-text";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  serviceJsonLd,
  webPageJsonLd,
} from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { NOINDEX_LANDING_SLUGS, getLandingPage, type LandingPage } from "@/lib/landing-pages";
import { pageUpdated } from "@/lib/page-dates";

/** Product facts used as the proof block until client case studies are published. */
const PROOF_FACTS = [
  { value: "18", label: "home-service trades" },
  { value: "50", label: "US states, plus CA, UK, AU, NZ" },
  { value: "4", label: "AI scores on every lead (0-100)" },
  { value: "10", label: "free leads, no credit card" },
];

export function landingMetadata(slug: string): Metadata {
  const page = getLandingPage(slug);
  if (!page) return {};
  return buildMetadata({
    title: page.titleTag,
    description: page.metaDescription,
    path: `/${page.slug}`,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    noIndex: NOINDEX_LANDING_SLUGS.has(page.slug),
  });
}

export function LandingPageView({ slug }: { slug: string }) {
  const page = getLandingPage(slug);
  if (!page) notFound();
  const path = `/${page.slug}`;
  const allText = [page.intro, ...page.sections.flatMap((s) => [s.body, ...(s.bullets ?? [])])];
  const budget = createLinkBudget(path, allText);

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            ...(page.parent ? [page.parent] : []),
            { name: page.breadcrumb, path },
          ]),
          page.kind === "product"
            ? serviceJsonLd({
                name: page.h1,
                description: page.metaDescription,
                path,
                serviceType: page.serviceType ?? page.primaryKeyword,
              })
            : webPageJsonLd({
                name: page.h1,
                description: page.metaDescription,
                path,
                dateModified: pageUpdated(path),
              }),
          faqPageJsonLd(page.faqs, path),
        ]}
      />

      <MarketingSubpageHero eyebrow={page.eyebrow} title={page.h1} description={page.heroDescription}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={page.cta.href}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            {page.cta.label}
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            View plans
          </Link>
        </div>
      </MarketingSubpageHero>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {/* Quick answer: the main question and a complete 40-60 word answer */}
        <section className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900 sm:text-[22px]">
            {page.quickAnswer.q}
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-slate-700">{page.quickAnswer.a}</p>
        </section>

        <p className="mt-8 text-[16px] leading-relaxed text-slate-700">
          <LinkedText text={page.intro} budget={budget} id="intro" />
        </p>

        {page.audienceNote ? (
          <aside className="mt-6 rounded-xl border border-violet-200 bg-violet-50/60 p-4 text-[14px] leading-relaxed text-slate-700">
            <LinkedText text={page.audienceNote} budget={budget} id="note" />
          </aside>
        ) : null}

        {page.sections.map((s, si) => (
          <section key={s.heading} className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
              {s.heading}
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-slate-700">
              <LinkedText text={s.body} budget={budget} id={`s${si}`} />
            </p>
            {s.bullets ? (
              <ul className="mt-4 space-y-2.5">
                {s.bullets.map((b, bi) => (
                  <li key={b} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                    <HiOutlineCheck className="mt-1 h-4 w-4 shrink-0 text-fuchsia-600" aria-hidden />
                    <span>
                      <LinkedText text={b} budget={budget} id={`s${si}b${bi}`} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {s.table ? (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[520px] text-left text-[14px]">
                  <thead className="bg-slate-50 text-[12px] uppercase tracking-wider text-slate-600">
                    <tr>
                      {s.table.headers.map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {s.table.rows.map((row) => (
                      <tr key={row.join("|")}>
                        {row.map((cell, ci) => (
                          <td key={ci} className={ci === 0 ? "px-4 py-3 font-semibold text-slate-900" : "px-4 py-3"}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {s.callout ? (
              <div className="mt-5 rounded-xl border-l-4 border-fuchsia-500 bg-fuchsia-50/60 p-4">
                <p className="text-[13px] font-bold uppercase tracking-wider text-fuchsia-700">{s.callout.title}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-700">{s.callout.text}</p>
              </div>
            ) : null}
          </section>
        ))}

        {/* Proof block: verifiable product facts */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-[19px] font-bold text-slate-900">
            Contractor Leads in numbers
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PROOF_FACTS.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-[family-name:var(--font-display)] text-[26px] font-semibold text-slate-900">
                    {f.value}
                  </span>
                  <span className="block text-[12.5px] leading-snug text-slate-600">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[13px] text-slate-500">
            See a{" "}
            <Link href="/features" className="font-semibold text-fuchsia-700 hover:underline">
              full feature walkthrough
            </Link>{" "}
            or start with{" "}
            <Link href="/register" className="font-semibold text-fuchsia-700 hover:underline">
              10 free leads
            </Link>
            .
          </p>
        </section>

        {/* Visible FAQ (matches the FAQPage structured data) */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            {page.primaryKeyword.charAt(0).toUpperCase() + page.primaryKeyword.slice(1)}: FAQ
          </h2>
          <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-6">
            {page.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
                <dd className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      <SubpageSection tone="soft" eyebrow="Keep reading" title="Related pages and guides">
        <SubpageLinkGrid columns={3} items={page.related} />
      </SubpageSection>

      <SubpageCtaBand
        title={page.ctaBand.title}
        description={page.ctaBand.description}
        primaryLabel="Start free trial"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}

/** Plain text of a page's body, for word counts and checks. */
export function landingPlainText(page: LandingPage): string {
  return [
    page.quickAnswer.a,
    page.intro,
    page.audienceNote ?? "",
    ...page.sections.flatMap((s) => [s.heading, s.body, ...(s.bullets ?? []), ...(s.table?.rows.flat() ?? [])]),
    ...page.faqs.flatMap((f) => [f.q, f.a]),
  ]
    .map(stripLinkMarkup)
    .join(" ");
}
