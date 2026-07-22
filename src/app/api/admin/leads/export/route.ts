import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadsToCsv, leadsToExcel, type ExportLead } from "@/lib/services/export";
import {
  adminLeadOrderBy,
  buildAdminLeadWhere,
  parseAdminLeadFilters,
} from "@/lib/admin-lead-filters";

export async function GET(request: Request) {
  const admin = await requirePermission("leads_export");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const filters = parseAdminLeadFilters(searchParams);

  const where =
    ids.length > 0 ? { id: { in: ids } } : buildAdminLeadWhere(filters);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: adminLeadOrderBy(filters.sort),
    take: 5000,
  });

  if (!leads.length) {
    return NextResponse.json({ error: "No leads to export" }, { status: 400 });
  }

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
