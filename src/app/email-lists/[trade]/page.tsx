import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView, landingMetadata } from "@/components/marketing/landing-page";
import { EMAIL_LIST_TRADES } from "@/lib/email-list-pages";

type Params = { params: Promise<{ trade: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return EMAIL_LIST_TRADES.map((t) => ({ trade: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { trade } = await params;
  return landingMetadata(`email-lists/${trade}`);
}

export default async function Page({ params }: Params) {
  const { trade } = await params;
  if (!EMAIL_LIST_TRADES.some((t) => t.slug === trade)) notFound();
  return <LandingPageView slug={`email-lists/${trade}`} />;
}
