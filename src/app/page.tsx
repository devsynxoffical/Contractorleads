import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { getMarketingPlansLive } from "@/components/marketing/marketing-plans-data";
import {
  JsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/components/seo/json-ld";
import { SEO, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: SEO.defaultTitle,
  description: SEO.defaultDescription,
  path: "/",
});

/** Live admin prices — do not prerender at build (DB not available on Railway). */
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const plans = await getMarketingPlansLive();
  // Logged-in users can still visit the marketing homepage; header shows Dashboard.
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqPageJsonLd()} />
      <MarketingPage plans={plans} />
    </>
  );
}
