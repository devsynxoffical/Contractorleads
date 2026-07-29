import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MorningDigestView } from "@/components/home/morning-digest-view";

export default async function DigestPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const displayName =
    user.name || user.ownerName || user.companyName || null;

  return <MorningDigestView userName={displayName} />;
}
