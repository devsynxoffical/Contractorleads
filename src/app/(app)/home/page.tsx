import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeView } from "@/components/home/home-view";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const displayName =
    user.name || user.ownerName || user.companyName || null;

  return <HomeView userName={displayName} />;
}
