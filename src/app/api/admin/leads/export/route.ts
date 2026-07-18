import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadsToCsv, leadsToExcel, type ExportLead } from "@/lib/services/export";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const where: Prisma.LeadWhereInput = {
    ...(industry ? { industry } : {}),
    ...(country ? { country } : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { ownerName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const rows = leads as unknown as ExportLead[];

  if (format === "xlsx") {
    const buffer = await leadsToExcel(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leads-export.xlsx"`,
      },
    });
  }

  const csv = leadsToCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-export.csv"`,
    },
  });
}
