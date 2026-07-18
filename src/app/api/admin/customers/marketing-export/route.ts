import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { ADMIN_STAFF_ROLES, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const HEADERS = [
  "Email",
  "Phone",
  "Contact Name",
  "Company",
  "Business Description",
  "Services Offered",
  "Ideal Customer",
  "Service Areas",
  "Main Goal",
  "Plan",
  "Subscription Status",
  "Active",
  "Credits Remaining",
  "Onboarding Complete",
  "Total Searches",
  "Saved Leads",
  "Last Search At",
  "Signed Up At",
  "Last Updated At",
  "Admin Notes",
];

function escapeCsv(val: string | number | boolean | null | undefined) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function loadAgencies() {
  return prisma.user.findMany({
    where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
    orderBy: { createdAt: "desc" },
    select: {
      email: true,
      phone: true,
      name: true,
      companyName: true,
      businessDescription: true,
      services: true,
      idealCustomer: true,
      serviceAreas: true,
      mainGoal: true,
      plan: true,
      subscriptionStatus: true,
      isActive: true,
      creditsRemaining: true,
      onboardingComplete: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { searches: true, savedLeads: true } },
      searches: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      },
    },
  });
}

function rowFromAgency(
  c: Awaited<ReturnType<typeof loadAgencies>>[number]
): (string | number)[] {
  return [
    c.email,
    c.phone ?? "",
    c.name ?? "",
    c.companyName ?? "",
    c.businessDescription ?? "",
    c.services ?? "",
    c.idealCustomer ?? "",
    c.serviceAreas ?? "",
    c.mainGoal ?? "",
    c.plan,
    c.subscriptionStatus,
    c.isActive ? "yes" : "no",
    c.creditsRemaining,
    c.onboardingComplete ? "yes" : "no",
    c._count.searches,
    c._count.savedLeads,
    c.searches[0]?.createdAt.toISOString() ?? "",
    c.createdAt.toISOString(),
    c.updatedAt.toISOString(),
    c.adminNotes ?? "",
  ];
}

/**
 * Full agency roster for SaaS product marketing / outreach.
 * Includes onboarding profile fields, plan, and usage signals.
 */
export async function GET(request: Request) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const agencies = await loadAgencies();

  if (!agencies.length) {
    return NextResponse.json(
      { error: "No agency users to export" },
      { status: 400 }
    );
  }

  const rows = agencies.map(rowFromAgency);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Agency Marketing");
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
        "Content-Disposition": `attachment; filename="agency-marketing-export.xlsx"`,
      },
    });
  }

  const csv = [HEADERS, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agency-marketing-export.csv"`,
    },
  });
}
