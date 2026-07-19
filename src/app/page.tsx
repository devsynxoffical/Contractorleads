import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MarketingPage } from "@/components/marketing/marketing-page";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.onboardingComplete ? "/home" : "/onboarding");
  }

  return <MarketingPage />;
}
