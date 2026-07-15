import Image from "next/image";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.onboardingComplete) redirect("/home");

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Contractor Leads"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            Set up your workspace
          </h1>
          <p className="text-center text-sm text-ink-muted">
            This powers your AI assistant and outreach — you only do it once.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}
