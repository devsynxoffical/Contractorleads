import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LEAD_STATUSES } from "@/lib/constants";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { PipelineBoard } from "@/components/leads/pipeline-board";
import { HiOutlineMagnifyingGlass, HiOutlineStar } from "react-icons/hi2";

export default async function PipelinePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const saved = await prisma.savedLead.findMany({
    where: { userId: user.id },
    include: { lead: true },
    orderBy: { updatedAt: "desc" },
  });

  const validStatuses = new Set<string>(LEAD_STATUSES.map((s) => s.value));

  const columns = LEAD_STATUSES.map((status) => ({
    ...status,
    items: saved
      .filter(
        (s) =>
          s.status === status.value ||
          (status.value === "new" && !validStatuses.has(s.status)),
      )
      .map((s) => ({
        id: s.id,
        status: s.status,
        favorite: s.favorite,
        lead: {
          id: s.lead.id,
          businessName: s.lead.businessName,
          address: s.lead.address,
          leadScore: s.lead.leadScore,
          email: s.lead.email,
          qualityTier: s.lead.qualityTier,
        },
      })),
  }));

  return (
    <div className="page-pad">
      <PageHeader
        title="Pipeline CRM"
        description="Add leads from Lead Finder, then move them New → Contacted → Qualified → Closed. Drag cards or use the status menu on each card."
        actions={
          <>
            <SecondaryActionLink href="/leads/saved">
              <HiOutlineStar className="h-4 w-4" />
              Saved Leads
            </SecondaryActionLink>
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          </>
        }
      />

      <PipelineBoard initialColumns={columns} />
    </div>
  );
}
