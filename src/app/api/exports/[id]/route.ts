import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadsToCsv, leadsToExcel, type ExportLead } from "@/lib/services/export";

function parseLeadIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
    }
  } catch {
    // Legacy comma-separated storage
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Re-download a past export — no extra credits (leads were already billed). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const row = await prisma.export.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  const leadIds = parseLeadIds(row.leadIds);
  if (!leadIds.length) {
    return NextResponse.json({ error: "Export has no leads" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: {
      id: { in: leadIds },
      search: { userId: user.id },
    },
  });

  const byId = new Map(leads.map((l) => [l.id, l]));
  const ordered = leadIds
    .map((leadId) => byId.get(leadId))
    .filter((l): l is (typeof leads)[number] => Boolean(l));

  if (!ordered.length) {
    return NextResponse.json({ error: "Leads no longer available" }, { status: 404 });
  }

  const stamp = new Date(row.createdAt).toISOString().slice(0, 10);
  const filename =
    format === "xlsx"
      ? `contractor-leads-${stamp}.xlsx`
      : `contractor-leads-${stamp}.csv`;

  if (format === "xlsx") {
    const buffer = await leadsToExcel(ordered as ExportLead[]);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const csv = leadsToCsv(ordered as ExportLead[]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
