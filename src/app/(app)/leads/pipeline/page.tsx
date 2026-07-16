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

  const columns = LEAD_STATUSES.map((status) => ({
    ...status,
    items: saved
      .filter((s) => s.status === status.value)
      .map((s) => ({
        id: s.id,
        status: s.status,
        lead: {
          id: s.lead.id,
          businessName: s.lead.businessName,
          address: s.lead.address,
          leadScore: s.lead.leadScore,
        },
      })),
  }));

  return (
    <div className="page-pad">
      <PageHeader
        title="Pipeline CRM"
        description="Track saved leads: New → Contacted → Qualified → Closed. Change status on any card."
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
