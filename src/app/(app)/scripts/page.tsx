import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScriptsLibrary } from "@/components/scripts/scripts-library";
import {
  PageHeader,
  PrimaryActionLink,
} from "@/components/layout/page-header";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

export default async function ScriptsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const scripts = await prisma.script.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-pad">
      <PageHeader
        title="My Scripts"
        description="Saved outputs from Ask Expert and Outreach Studio."
        actions={
          <PrimaryActionLink href="/ask-expert">
            <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
            Ask Expert
          </PrimaryActionLink>
        }
      />
      <ScriptsLibrary initialScripts={scripts} />
    </div>
  );
}
