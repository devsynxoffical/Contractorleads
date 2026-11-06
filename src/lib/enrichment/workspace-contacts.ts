import { prisma } from "@/lib/prisma";

/**
 * The workspace's private enrichment results laid over shared lead records. Paid owner /
 * email data is stored per workspace (WorkspaceLeadContact); it only fills fields the
 * shared lead does not have, and only for the workspace that paid for it.
 */
export async function overlayWorkspaceContacts<T extends { id: string; ownerName?: string | null; ownerTitle?: string | null; email?: string | null; linkedinUrl?: string | null }>(
  userId: string,
  leads: T[],
): Promise<Array<T & { workspaceContact?: { email: string | null; emailStatus: string | null; mobile: string | null; source: string | null } }>> {
  if (!leads.length) return leads;
  const contacts = await prisma.workspaceLeadContact.findMany({
    where: { userId, leadId: { in: leads.map((l) => l.id) } },
  });
  const map = new Map(contacts.map((c) => [c.leadId, c]));
  return leads.map((l) => {
    const c = map.get(l.id);
    if (!c) return l;
    return {
      ...l,
      ownerName: l.ownerName || c.ownerName,
      ownerTitle: l.ownerTitle || c.ownerTitle,
      email: l.email || c.email,
      linkedinUrl: l.linkedinUrl || c.linkedinUrl,
      workspaceContact: { email: c.email, emailStatus: c.emailStatus, mobile: c.mobile, source: c.emailProvider },
    };
  });
}
