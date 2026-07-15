import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadsToCsv, leadsToExcel } from "@/lib/services/export";
import { logActivity } from "@/lib/credits";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadIds, format } = await request.json();

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "No leads selected" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
  });

  await prisma.export.create({
    data: {
      userId: user.id,
      format,
      leadIds: JSON.stringify(leadIds),
    },
  });

  await logActivity(user.id, "export", `Exported ${leads.length} leads as ${format}`);

  if (format === "xlsx") {
    const buffer = await leadsToExcel(leads);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leadflow-export.xlsx"`,
      },
    });
  }

  const csv = leadsToCsv(leads);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leadflow-export.csv"`,
    },
  });
}
