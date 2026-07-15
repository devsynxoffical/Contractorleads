import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeView } from "@/components/home/home-view";

export default async function HomeAppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <HomeView userName={user.name} />;
}
