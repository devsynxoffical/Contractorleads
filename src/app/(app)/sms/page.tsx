import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SmsWorkspace } from "@/components/sms/sms-workspace";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasMessagingAddon } from "@/lib/messaging-addon";
import { isTwilioConfigured } from "@/lib/twilio-config";

export default async function SmsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });

  const hasAddon = hasMessagingAddon(dbUser ?? user);
  const twilioReady = await isTwilioConfigured();

  return (
    <div className="page-pad space-y-8">
      <PageHeader
        title="SMS"
        description="Text lead phone numbers via Twilio. Requires the Messaging add-on. Replies show up here when the Twilio webhook is connected."
        backHref="/dashboard"
        backLabel="Back to dashboard"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "SMS" },
        ]}
      />

      <SmsWorkspace hasAddon={hasAddon} twilioReady={twilioReady} />
    </div>
  );
}
