import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sendLeadEmail } from "@/lib/lead-email";
import { prisma } from "@/lib/prisma";
import { listSmtpAccounts, maskSmtpAccount, migrateLegacySmtpIfNeeded } from "@/lib/user-smtp";
import { isLeadUnlocked } from "@/lib/lead-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;
  const emails = await prisma.leadEmail.findMany({
    where: { userId: user.id, leadId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await migrateLegacySmtpIfNeeded(user.id);
  const accounts = await listSmtpAccounts(user.id);

  return NextResponse.json({
    emails,
    accounts: accounts.filter((a) => a.enabled).map(maskSmtpAccount),
  });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;

  if (!(await isLeadUnlocked(user.id, leadId))) {
    return NextResponse.json(
      {
        error: "Unlock this lead before sending email.",
        code: "LEAD_LOCKED",
        upgradeUrl: "/billing",
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const subject = String(body.subject || "");
  const text = String(body.body || body.text || "");
  const smtpAccountId = body.smtpAccountId
    ? String(body.smtpAccountId)
    : null;

  try {
    const result = await sendLeadEmail({
      userId: user.id,
      leadId,
      subject,
      body: text,
      smtpAccountId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 400 },
    );
  }
}
