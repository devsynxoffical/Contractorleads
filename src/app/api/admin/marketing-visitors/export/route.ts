import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const HEADERS = [
  "Email",
  "Opt-in",
  "Source",
  "Landing Path",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "Visit Count",
  "First Seen",
  "Last Seen",
  "Converted User Id",
  "Converted At",
  "Referrer",
];

function escapeCsv(val: string | number | boolean | null | undefined) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const optInOnly = searchParams.get("optIn") !== "0";

  const visitors = await prisma.marketingVisitor.findMany({
    where: {
      email: { not: null },
      ...(optInOnly ? { emailOptIn: true } : {}),
    },
    orderBy: { lastSeenAt: "desc" },
  });

  if (!visitors.length) {
    return NextResponse.json(
      { error: "No marketing visitors with email to export" },
      { status: 400 },
    );
  }

  const rows = visitors.map((v) => [
    v.email ?? "",
    v.emailOptIn ? "yes" : "no",
    v.source ?? "",
    v.landingPath ?? "",
    v.utmSource ?? "",
    v.utmMedium ?? "",
    v.utmCampaign ?? "",
    v.visitCount,
    v.firstSeenAt.toISOString(),
    v.lastSeenAt.toISOString(),
    v.convertedUserId ?? "",
    v.convertedAt?.toISOString() ?? "",
    v.referrer ?? "",
  ]);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Site marketing leads");
    sheet.addRow(HEADERS);
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((col) => {
      col.width = 22;
    });
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="site-marketing-leads.xlsx"`,
      },
    });
  }

  const csv = [HEADERS, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="site-marketing-leads.csv"`,
    },
  });
}
