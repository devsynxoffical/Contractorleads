import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailDashboardStats } from "@/lib/email-dashboard";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 30), 100);

  const [stats, emails] = await Promise.all([
    getEmailDashboardStats(user.id),
    prisma.leadEmail.findMany({
      where: { userId: user.id },
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        direction: true,
        status: true,
        subject: true,
        fromEmail: true,
        toEmail: true,
        createdAt: true,
        error: true,
        lead: { select: { id: true, businessName: true } },
      },
    }),
  ]);

  return NextResponse.json({ stats, emails });
}
