import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmailWorkspace } from "@/components/email/email-workspace";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasMessagingAddon } from "@/lib/messaging-addon";
import { listSmtpAccounts, migrateLegacySmtpIfNeeded } from "@/lib/user-smtp";

export default async function InboxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await migrateLegacySmtpIfNeeded(user.id);
  const [dbUser, accounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        messagingAddonStatus: true,
        messagingAddonManual: true,
      },
    }),
    listSmtpAccounts(user.id),
  ]);

  const smtpReady = accounts.some((a) => a.enabled && a.fromEmail);
  const hasAddon = hasMessagingAddon(dbUser ?? user);

  return (
    <div className="page-pad space-y-8">
      <PageHeader
        title="Email"
        description="Full email workspace: setup your mailbox, compose to any lead, bulk send campaigns, read replies, run sequences, and track activity."
        backHref="/setup"
        backLabel="Back to setup"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Setup", href: "/setup" },
          { label: "Email" },
        ]}
      />

      <Suspense
        fallback={
          <p className="text-[13px] text-ink-muted">Loading email workspace…</p>
        }
      >
        <EmailWorkspace smtpReady={smtpReady} hasAddon={hasAddon} />
      </Suspense>
    </div>
  );
}
