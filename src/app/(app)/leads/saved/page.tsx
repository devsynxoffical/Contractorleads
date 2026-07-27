import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { ExportLeadsButtons } from "@/components/leads/export-leads-buttons";
import { SavedLeadsManager } from "@/components/leads/saved-leads-manager";
import {
  hasMessagingAddon,
  MESSAGING_ADDON_PRICE_USD,
} from "@/lib/messaging-addon";
import {
  listSmtpAccounts,
  maskSmtpAccount,
  migrateLegacySmtpIfNeeded,
} from "@/lib/user-smtp";
import { HiOutlineMagnifyingGlass, HiOutlineViewColumns } from "react-icons/hi2";

export default async function SavedLeadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [saved, dbUser] = await Promise.all([
    prisma.savedLead.findMany({
      where: { userId: user.id },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        messagingAddonStatus: true,
        messagingAddonManual: true,
      },
    }),
  ]);

  await migrateLegacySmtpIfNeeded(user.id);
  const mailboxes = (await listSmtpAccounts(user.id))
    .filter((a) => a.enabled)
    .map(maskSmtpAccount)
    .map((m) => ({
      id: m.id,
      label: m.label,
      fromEmail: m.fromEmail,
      isDefault: m.isDefault,
    }));

  const rows = saved.map((s) => ({
    id: s.id,
    status: s.status,
    favorite: s.favorite,
    savedAt: s.updatedAt.toISOString(),
    lead: {
      id: s.lead.id,
      businessName: s.lead.businessName,
      address: s.lead.address,
      email: s.lead.email,
      industry: s.lead.industry,
      qualityTier: s.lead.qualityTier,
      leadScore: s.lead.leadScore,
    },
  }));

  const categories = [
    ...new Set(
      saved
        .map((s) => s.lead.industry)
        .filter((v): v is string => Boolean(v?.trim())),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="page-pad">
      <PageHeader
        title="Saved Leads"
        description={`${saved.length} leads in your workspace.`}
        actions={
          <>
            <ExportLeadsButtons scope="saved" disabled={!saved.length} />
            <SecondaryActionLink href="/leads/pipeline">
              <HiOutlineViewColumns className="h-4 w-4" />
              Pipeline
            </SecondaryActionLink>
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          </>
        }
      />

      <SavedLeadsManager
        leads={rows}
        categories={categories}
        hasAddon={dbUser ? hasMessagingAddon(dbUser) : false}
        addonPriceUsd={MESSAGING_ADDON_PRICE_USD}
        mailboxes={mailboxes}
      />
    </div>
  );
}
