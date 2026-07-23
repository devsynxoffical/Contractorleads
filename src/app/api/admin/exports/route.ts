import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function leadCountFromIds(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return raw ? raw.split(",").filter(Boolean).length : 0;
  }
}

export async function GET(request: Request) {
  const admin = await requirePermission("exports");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 80), 200);

  const [rows, total, byFormat] = await Promise.all([
    prisma.export.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
            plan: true,
          },
        },
      },
    }),
    prisma.export.count(),
    prisma.export.groupBy({
      by: ["format"],
      _count: { _all: true },
    }),
  ]);

  const exports = rows.map((row) => ({
    id: row.id,
    format: row.format,
    leadCount: leadCountFromIds(row.leadIds),
    createdAt: row.createdAt,
    user: row.user,
  }));

  const leadsByFormat = new Map<string, number>();
  for (const row of exports) {
    leadsByFormat.set(
      row.format,
      (leadsByFormat.get(row.format) ?? 0) + row.leadCount,
    );
  }

  return NextResponse.json({
    total,
    byFormat: byFormat.map((g) => ({
      format: g.format,
      count: g._count._all,
      leads: leadsByFormat.get(g.format) ?? 0,
    })),
    exports,
  });
}
