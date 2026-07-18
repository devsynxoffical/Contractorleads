import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const HEADERS = [
  "Agency Email",
  "Agency Company",
  "Status",
  "Favorite",
  "Business Name",
  "Industry",
  "Phone",
  "Email",
  "City",
  "State",
  "Country",
  "Lead Score",
  "Saved At",
];

function rowFromSaved(row: {
  status: string;
  favorite: boolean;
  updatedAt: Date;
  user: { email: string; companyName: string | null };
  lead: {
    businessName: string;
    industry: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    country: string;
    leadScore: number;
  };
}) {
  return [
    row.user.email,
    row.user.companyName ?? "",
    row.status,
    row.favorite ? "yes" : "no",
    row.lead.businessName,
    row.lead.industry ?? "",
    row.lead.phone ?? "",
    row.lead.email ?? "",
    row.lead.city ?? "",
    row.lead.state ?? "",
    row.lead.country,
    row.lead.leadScore,
    row.updatedAt.toISOString(),
  ];
}

export async function GET(request: Request) {
  const admin = await requirePermission("leads_export");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const saved = await prisma.savedLead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5000,
    include: {
      user: { select: { email: true, companyName: true } },
      lead: {
        select: {
          businessName: true,
          industry: true,
          phone: true,
          email: true,
          city: true,
          state: true,
          country: true,
          leadScore: true,
        },
      },
    },
  });

  if (!saved.length) {
    return NextResponse.json({ error: "No saved leads to export" }, { status: 400 });
  }

  const rows = saved.map(rowFromSaved);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Saved Leads");
    sheet.addRow(HEADERS);
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((col) => {
      col.width = 18;
    });
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="saved-leads-export.xlsx"`,
      },
    });
  }

  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [HEADERS, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="saved-leads-export.csv"`,
    },
  });
}
