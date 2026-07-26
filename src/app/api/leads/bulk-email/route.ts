import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkLeadEmail } from "@/lib/lead-email";
import { hasMessagingAddon } from "@/lib/messaging-addon";
import { listSmtpAccounts, migrateLegacySmtpIfNeeded } from "@/lib/user-smtp";

/** Confirm the user has the Messaging add-on (or is staff). */
async function requireMessagingAddon(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, messagingAddonStatus: true, messagingAddonManual: true },
  });
  return u ? hasMessagingAddon(u) : false;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await requireMessagingAddon(user.id))) {
    return NextResponse.json(
      {
        error:
          "Bulk email requires the Messaging add-on ($15.50/mo). Add it on the Billing page.",
        locked: true,
        addon: "messaging",
      },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const leadIds: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.map((x: unknown) => String(x)).filter(Boolean)
    : [];
  const subject = String(body.subject || "");
  const text = String(body.body || body.text || "");
  const smtpAccountId = body.smtpAccountId ? String(body.smtpAccountId) : null;

  if (!leadIds.length) {
    return NextResponse.json({ error: "Select at least one lead" }, { status: 400 });
  }

  // Ensure the user has a usable mailbox before starting.
  await migrateLegacySmtpIfNeeded(user.id);
  const accounts = await listSmtpAccounts(user.id);
  if (!accounts.some((a) => a.enabled)) {
    return NextResponse.json(
      { error: "Connect an SMTP mailbox under Email & SMTP settings first." },
      { status: 400 },
    );
  }

  try {
    const result = await sendBulkLeadEmail({
      userId: user.id,
      leadIds,
      subject,
      body: text,
      smtpAccountId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bulk send failed" },
      { status: 400 },
    );
  }
}
