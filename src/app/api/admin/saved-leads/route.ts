import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") ?? 40)));
  const userId = searchParams.get("userId")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const where = {
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
  };

  const [total, saved] = await Promise.all([
    prisma.savedLead.count({ where }),
    prisma.savedLead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
          },
        },
        lead: {
          select: {
            id: true,
            businessName: true,
            industry: true,
            city: true,
            state: true,
            country: true,
            leadScore: true,
            phone: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ saved, total, page, pageSize });
}
