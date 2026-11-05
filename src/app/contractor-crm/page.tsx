import { LandingPageView, landingMetadata } from "@/components/marketing/landing-page";

export const metadata = landingMetadata("contractor-crm");

export default function Page() {
  return <LandingPageView slug="contractor-crm" />;
}
