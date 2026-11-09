import { LandingPageView, landingMetadata } from "@/components/marketing/landing-page";

export const metadata = landingMetadata("email-lists");

export default function Page() {
  return <LandingPageView slug="email-lists" />;
}
