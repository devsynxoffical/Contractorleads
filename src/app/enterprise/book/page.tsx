import type { Metadata } from "next";
import { HiOutlineCheck } from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import { SubpageSection } from "@/components/marketing/marketing-subpage";
import { EnterpriseBookingForm } from "@/components/marketing/enterprise-booking-form";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Enterprise", path: "/enterprise/book" },
        ])}
      />

      <MarketingSubpageHero
        eyebrow="Enterprise"
        title="Book a strategy call"
        description="Talk through volume pricing, white-label, API access, and dedicated support with someone who knows the product."
      >
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70">
          {[
            "Volume and multi-seat pricing",
            "White-label and API access",
            "Dedicated onboarding",
          ].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" />
              {item}
            </li>
          ))}
        </ul>
      </MarketingSubpageHero>

      <SubpageSection tone="tint">
        <div className="mx-auto max-w-3xl">
          <EnterpriseBookingForm source="enterprise-page" />
        </div>
      </SubpageSection>
    </MarketingSiteShell>
  );
}
