import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailDashboardStats } from "@/lib/email-dashboard";

export async function GET(request: Request) {
  const admin = await requirePermission("communications");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 50), 200);

  const [stats, emails, smtpAccounts, sequences] = await Promise.all([
    getEmailDashboardStats(),
    prisma.leadEmail.findMany({
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
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
          },
        },
        lead: {
          select: { id: true, businessName: true },
        },
      },
    }),
    prisma.smtpAccount.findMany({
      take: 40,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        label: true,
        host: true,
        fromEmail: true,
        isDefault: true,
        enabled: true,
        updatedAt: true,
        user: {
          select: { id: true, email: true, companyName: true, name: true },
        },
      },
    }),
    prisma.emailSequence.findMany({
      take: 40,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        enabled: true,
        updatedAt: true,
        user: {
          select: { id: true, email: true, companyName: true, name: true },
        },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats,
    emails,
    smtpAccounts,
    sequences,
  });
}
