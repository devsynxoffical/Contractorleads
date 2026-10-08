import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OWNER_EMAIL = "hello@contractorleads.us";

async function main() {
  console.log("=================================================");
  console.log("🔒 Fixing User Mailbox Scoping & Database Sync");
  console.log("=================================================");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      companyName: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${users.length} total user(s) in database.\n`);

  for (const user of users) {
    const isOwner =
      user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() ||
      user.role === "OWNER" ||
      user.role === "SUPER_ADMIN";

    if (isOwner) {
      console.log(`👑 [SUPER ADMIN] ${user.email} (${user.id}) -> Retains full platform access.`);
      continue;
    }

    // 1. Fetch assigned system mailboxes
    const assignedSys = await prisma.systemSmtpAccount.findMany({
      where: { assignedUserId: user.id },
      select: { id: true, fromEmail: true, domain: true, label: true },
    });

    // 2. Fetch user custom SMTP accounts
    const userCustom = await prisma.smtpAccount.findMany({
      where: { userId: user.id },
      select: { id: true, fromEmail: true, label: true },
    });

    const allowedEmails = new Set([
      ...assignedSys.map((s) => s.fromEmail.toLowerCase().trim()),
      ...userCustom.map((c) => c.fromEmail.toLowerCase().trim()),
    ]);

    const allowedSysIds = new Set(assignedSys.map((s) => s.id));
    const allowedCustomIds = new Set(userCustom.map((c) => c.id));

    console.log(`\n👤 User: ${user.email} (${user.name || "No name"})`);
    console.log(`   Role: ${user.role}`);
    console.log(
      `   Assigned Mailboxes (${assignedSys.length + userCustom.length}):`,
      [...allowedEmails].join(", ") || "(None assigned yet)"
    );

    // 3. Find any LeadEmail records for this user that belong to unassigned system mailboxes
    const allUserEmails = await prisma.leadEmail.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        fromEmail: true,
        toEmail: true,
        systemSmtpAccountId: true,
        smtpAccountId: true,
        subject: true,
      },
    });

    let detachedCount = 0;
    for (const email of allUserEmails) {
      const from = (email.fromEmail || "").toLowerCase().trim();
      const to = (email.toEmail || "").toLowerCase().trim();
      const sysId = email.systemSmtpAccountId;
      const customId = email.smtpAccountId;

      const isAllowed =
        allowedEmails.has(from) ||
        allowedEmails.has(to) ||
        (sysId && allowedSysIds.has(sysId)) ||
        (customId && allowedCustomIds.has(customId));

      if (!isAllowed) {
        // Delete or detach from this non-admin user
        await prisma.leadEmail.delete({
          where: { id: email.id },
        });
        detachedCount++;
      }
    }

    if (detachedCount > 0) {
      console.log(`   🧹 Cleaned up ${detachedCount} unassigned/leaked email record(s) from this user's inbox.`);
    } else {
      console.log(`   ✅ Inbox is cleanly scoped.`);
    }
  }

  console.log("\n=================================================");
  console.log("✅ All user mailbox permissions fixed successfully.");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Error executing fix script:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
