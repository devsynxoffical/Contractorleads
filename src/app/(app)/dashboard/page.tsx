import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <DashboardView user={user} />;
}
