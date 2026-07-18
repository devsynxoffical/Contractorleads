import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AskExpertClient } from "@/components/ai/ask-expert-client";

export default async function AskExpertPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <AskExpertClient userName={user.name} />;
}
