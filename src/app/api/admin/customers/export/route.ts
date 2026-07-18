import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: string | number | null | undefined) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customers = await prisma.user.findMany({
    where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      plan: true,
      subscriptionStatus: true,
      creditsRemaining: true,
      onboardingComplete: true,
      services: true,
      serviceAreas: true,
      createdAt: true,
      _count: { select: { searches: true, savedLeads: true } },
    },
  });

  const headers = [
    "ID",
    "Email",
    "Name",
    "Company",
    "Plan",
    "Subscription Status",
    "Credits",
    "Onboarding Complete",
    "Services",
    "Service Areas",
    "Searches",
    "Saved Leads",
    "Created At",
  ];

  const rows = customers.map((c) =>
    [
      c.id,
      c.email,
      c.name,
      c.companyName,
      c.plan,
      c.subscriptionStatus,
      c.creditsRemaining,
      c.onboardingComplete ? "yes" : "no",
      c.services,
      c.serviceAreas,
      c._count.searches,
      c._count.savedLeads,
      c.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-export.csv"`,
    },
  });
}
