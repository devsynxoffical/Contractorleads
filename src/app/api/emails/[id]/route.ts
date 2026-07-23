import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listSmtpAccounts, maskSmtpAccount } from "@/lib/user-smtp";

type Params = { params: Promise<{ id: string }> };

/** View one email + full conversation thread for that lead. Marks inbound as read. */
export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const email = await prisma.leadEmail.findFirst({
    where: { id, userId: user.id },
    include: {
      lead: {
        select: {
          id: true,
          businessName: true,
          email: true,
          phone: true,
          ownerName: true,
        },
      },
    },
  });
  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (email.direction === "inbound" && !email.readAt) {
    await prisma.leadEmail.update({
      where: { id: email.id },
      data: { readAt: new Date() },
    });
    email.readAt = new Date();
  }

  const [thread, accounts] = await Promise.all([
    prisma.leadEmail.findMany({
      where: { userId: user.id, leadId: email.leadId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        direction: true,
        status: true,
        subject: true,
        body: true,
        fromEmail: true,
        toEmail: true,
        createdAt: true,
        readAt: true,
        error: true,
        messageId: true,
      },
    }),
    listSmtpAccounts(user.id).then((rows) =>
      rows.filter((r) => r.enabled).map(maskSmtpAccount),
    ),
  ]);

  return NextResponse.json({
    email: {
      id: email.id,
      direction: email.direction,
      status: email.status,
      subject: email.subject,
      body: email.body,
      fromEmail: email.fromEmail,
      toEmail: email.toEmail,
      createdAt: email.createdAt,
      readAt: email.readAt,
      messageId: email.messageId,
      lead: email.lead,
    },
    thread,
    accounts,
  });
}
