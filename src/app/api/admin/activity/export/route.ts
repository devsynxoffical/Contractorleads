import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: string | number | null | undefined) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      user: {
        select: { email: true, companyName: true, name: true, role: true },
      },
    },
  });

  const headers = [
    "ID",
    "Type",
    "Message",
    "User Email",
    "Company",
    "Role",
    "Metadata",
    "Created At",
  ];

  const rows = activities.map((a) =>
    [
      a.id,
      a.type,
      a.message,
      a.user.email,
      a.user.companyName,
      a.user.role,
      a.metadata,
      a.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(","),
  );

  return new NextResponse([headers.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-export.csv"`,
    },
  });
}
