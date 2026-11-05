import { LandingPageView, landingMetadata } from "@/components/marketing/landing-page";

export const metadata = landingMetadata("homeowner-leads");

export default function Page() {
  return <LandingPageView slug="homeowner-leads" />;
}
