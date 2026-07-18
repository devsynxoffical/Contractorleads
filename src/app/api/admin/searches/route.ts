import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const admin = await requirePermission("searches");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") ?? 40)));
  const industry = searchParams.get("industry")?.trim() ?? "";
  const userId = searchParams.get("userId")?.trim() ?? "";

  const where = {
    ...(industry ? { industry } : {}),
    ...(userId ? { userId } : {}),
  };

  const [total, searches] = await Promise.all([
    prisma.search.count({ where }),
    prisma.search.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
        _count: { select: { leads: true } },
      },
    }),
  ]);

  return NextResponse.json({ searches, total, page, pageSize });
}
