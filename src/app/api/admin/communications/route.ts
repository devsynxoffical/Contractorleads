import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const admin = await requirePermission("communications");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 50), 200);

  const [
    emails,
    smtpAccounts,
    sequences,
    enrollmentsActive,
    emailCount,
    smtpCount,
    sequenceCount,
  ] = await Promise.all([
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
    prisma.emailEnrollment.count({ where: { status: "active" } }),
    prisma.leadEmail.count(),
    prisma.smtpAccount.count(),
    prisma.emailSequence.count(),
  ]);

  return NextResponse.json({
    summary: {
      emails: emailCount,
      smtpAccounts: smtpCount,
      sequences: sequenceCount,
      enrollmentsActive,
    },
    emails,
    smtpAccounts,
    sequences,
  });
}
