import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sendLeadEmail } from "@/lib/lead-email";
import { prisma } from "@/lib/prisma";
import { LEAD_REPORT_SCRIPT_TYPE } from "@/lib/services/lead-intelligence-report";
import { listSmtpAccounts, maskSmtpAccount, migrateLegacySmtpIfNeeded } from "@/lib/user-smtp";

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

  const reports = await prisma.script.findMany({
    where: {
      userId: user.id,
      relatedLeadId: leadId,
      type: { startsWith: LEAD_REPORT_SCRIPT_TYPE },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      type: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    emails,
    accounts: accounts.filter((a) => a.enabled).map(maskSmtpAccount),
    reports,
  });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;

  const body = await request.json();
  const subject = String(body.subject || "");
  const text = String(body.body || body.text || "");
  const smtpAccountId = body.smtpAccountId
    ? String(body.smtpAccountId)
    : null;
  const attachReportId = body.attachReportId
    ? String(body.attachReportId)
    : null;

  try {
    const result = await sendLeadEmail({
      userId: user.id,
      leadId,
      subject,
      body: text,
      smtpAccountId,
      attachReportId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 400 },
    );
  }
}
