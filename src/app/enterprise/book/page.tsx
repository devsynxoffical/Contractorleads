import type { Metadata } from "next";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import { EnterpriseBookingForm } from "@/components/marketing/enterprise-booking-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Book an Enterprise call",
  description:
    "Schedule a strategy call with Contractor Leads to discuss Enterprise volume, white-label, API access, and dedicated support.",
  path: "/enterprise/book",
});

export default function EnterpriseBookPage() {
  return (
    <MarketingSiteShell>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <EnterpriseBookingForm source="enterprise-page" />
      </section>
    </MarketingSiteShell>
  );
}
