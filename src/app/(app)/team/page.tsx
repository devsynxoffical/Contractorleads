import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TeamMembersPanel } from "@/components/team/team-members-panel";
import { planHasFeature } from "@/lib/plans";

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const locked = !planHasFeature(user.plan, "teams");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Users and teams"
        description="Invite teammates, assign roles, and manage Agency seats. Available on Agency and Enterprise."
      />
      <TeamMembersPanel plan={user.plan} locked={locked} />
    </div>
  );
}
