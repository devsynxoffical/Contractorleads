import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  MESSAGING_ADDON_PRICE_LABEL,
  hasMessagingAddon,
} from "@/lib/messaging-addon";

export const MESSAGING_ADDON_REQUIRED_CODE = "messaging_addon_required";

/**
 * Policy: every *outbound* message a user sends from the app — 1:1 email,
 * bulk email, inbox replies, campaign sends/launches, sequence enrollment and
 * SMS — is locked behind the Messaging add-on. Reading inboxes, threads and
 * campaign stats stays open. Staff roles and admin-comped users
 * (`messagingAddonManual`) always pass; see `hasMessagingAddon`.
 *
 * Call at the top of a sending route handler after auth. Returns a 402
 * response (same shape as the SMS routes) when the add-on is missing,
 * otherwise null so the handler can continue.
 */
export async function requireMessagingAddon(user: {
  id: string;
  role?: string | null;
}): Promise<NextResponse | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });

  if (hasMessagingAddon(dbUser ?? user)) return null;

  return NextResponse.json(
    {
      error: `Email sending requires the Messaging add-on (${MESSAGING_ADDON_PRICE_LABEL}). Upgrade under Plans & Billing.`,
      code: MESSAGING_ADDON_REQUIRED_CODE,
    },
    { status: 402 },
  );
}
