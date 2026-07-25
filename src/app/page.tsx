import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MarketingPage } from "@/components/marketing/marketing-page";
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

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.onboardingComplete ? "/home" : "/onboarding");
  }

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqPageJsonLd()} />
      <MarketingPage />
    </>
  );
}
