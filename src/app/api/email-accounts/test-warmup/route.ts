import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runMailboxWarmupCycle } from "@/lib/warmup-engine";
import { userCanAccessMailbox } from "@/lib/mailbox-access";
import { isGlobalSuperAdmin } from "@/lib/roles";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * Live Warmup Test Verification API:
 * Allows the user or admin to trigger an immediate warmup email dispatch
 * from any mailbox to verify the entire Hostinger gateway + P2P flow.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  let email = (body.mailboxEmail || "").toLowerCase().trim();

  // If no email specified, pick the user's first active mailbox
  if (!email) {
    const firstAccount = await prisma.systemSmtpAccount.findFirst({
      where: { enabled: true, ...(isGlobalSuperAdmin(user) ? {} : { assignedUserId: user.id }) },
      select: { fromEmail: true },
    });
    if (!firstAccount) {
      return NextResponse.json({ error: "No active sending mailboxes found" }, { status: 400 });
    }
    email = firstAccount.fromEmail.toLowerCase();
  }

  if (!(await userCanAccessMailbox(user, email))) {
    return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
  }

  try {
    const result = await runMailboxWarmupCycle(email, { force: true });

    if (!result.dispatched) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Warmup cycle could not dispatch",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Warmup email successfully dispatched via Hostinger relay!`,
      details: {
        from: email,
        to: result.recipient,
        subject: result.subject,
        messageId: result.messageId,

        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Warmup test failed: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
