import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { AiAssistantSettingsForm } from "@/components/ai/ai-assistant-settings-form";

export default async function AiAssistantSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="AI Assistant settings"
        description="Tell the assistant who you are and who you sell to — so answers, hooks, and scripts fit your agency."
        backHref="/ask-expert"
        backLabel="Back to Ask Contractor Leads"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Ask Contractor Leads", href: "/ask-expert" },
          { label: "AI settings" },
        ]}
      />
      <AiAssistantSettingsForm user={user} />
    </div>
  );
}
