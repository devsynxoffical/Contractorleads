import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineCheck } from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageLinkGrid, SubpageSection } from "@/components/marketing/marketing-subpage";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd, webApplicationJsonLd } from "@/components/seo/json-ld";
import { EmailDnsChecker } from "@/components/tools/email-dns-checker";
import { LeadCostCalculator } from "@/components/tools/lead-cost-calculator";
import { SubjectLineTester } from "@/components/tools/subject-line-tester";
import { FREE_TOOLS, getFreeTool } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

type Params = { params: Promise<{ tool: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return FREE_TOOLS.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tool } = await params;
  const t = getFreeTool(tool);
  if (!t) return {};
  return buildMetadata({
    title: t.titleTag,
    description: t.metaDescription,
    path: `/tools/${t.slug}`,
    keywords: [t.primaryKeyword, ...t.secondaryKeywords],
  });
}

const WIDGETS = {
  "email-deliverability-checker": EmailDnsChecker,
  "cold-email-subject-line-tester": SubjectLineTester,
  "contractor-lead-cost-calculator": LeadCostCalculator,
} as const;

export default async function ToolPage({ params }: Params) {
  const { tool } = await params;
  const t = getFreeTool(tool);
  if (!t) notFound();
  const Widget = WIDGETS[t.slug];
  const path = `/tools/${t.slug}`;
  const others = FREE_TOOLS.filter((o) => o.slug !== t.slug);

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Free tools", path: "/tools" },
            { name: t.name, path },
          ]),
          webApplicationJsonLd({ name: t.name, description: t.metaDescription, path }),
          faqPageJsonLd(t.faqs, path),
        ]}
      />
      <MarketingSubpageHero eyebrow="Free tool · no sign-up" title={t.h1} description={t.intro} />

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Widget />

        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            How to use the {t.name.toLowerCase()}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-slate-700">
            {t.howTo.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        {t.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">{s.heading}</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-slate-700">{s.body}</p>
            {s.bullets ? (
              <ul className="mt-4 space-y-2.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                    <HiOutlineCheck className="mt-1 h-4 w-4 shrink-0 text-fuchsia-600" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="mt-10 rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
          <p className="text-[15px] leading-relaxed text-slate-700">
            Need contractors to email? Contractor Leads finds roofers, HVAC companies, plumbers and 15 more trades with owner
            names and verified emails.{" "}
            <Link href="/register" className="font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2">
              Start with 10 free leads
            </Link>
            .
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">FAQ</h2>
          <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-6">
            {t.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
                <dd className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      <SubpageSection tone="soft" eyebrow="Keep going" title="More free tools, services and guides">
        <SubpageLinkGrid
          columns={3}
          items={[
            ...others.map((o) => ({ href: `/tools/${o.slug}`, label: o.name })),
            { href: "/tools", label: "All free tools" },
            ...t.services,
            ...t.guides,
          ]}
        />
      </SubpageSection>

      <SubpageCtaBand
        title="Find contractor leads with verified emails"
        description="Search 18 trades by city or state, add owner names and verified emails, and send from warmed-up mailboxes."
        primaryLabel="Start free"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
