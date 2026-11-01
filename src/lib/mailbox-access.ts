import { prisma } from "@/lib/prisma";
import { isGlobalSuperAdmin } from "@/lib/roles";

/**
 * True when the user may view this mailbox: a system mailbox assigned to them, their own
 * SMTP account, or any mailbox for a super admin.
 */
export async function userCanAccessMailbox(
  user: { id: string; role?: string | null; email?: string | null },
  mailboxEmail: string,
): Promise<boolean> {
  if (isGlobalSuperAdmin(user)) return true;
  const email = mailboxEmail.toLowerCase().trim();
  const [system, own] = await Promise.all([
    prisma.systemSmtpAccount.findFirst({
      where: { fromEmail: { equals: email, mode: "insensitive" }, assignedUserId: user.id },
      select: { id: true },
    }),
    prisma.smtpAccount.findFirst({
      where: { fromEmail: { equals: email, mode: "insensitive" }, userId: user.id },
      select: { id: true },
    }),
  ]);
  return Boolean(system || own);
}
