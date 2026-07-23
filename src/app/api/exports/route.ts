import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadsToCsv, leadsToExcel, type ExportLead } from "@/lib/services/export";
import { logActivity } from "@/lib/credits";
import {
  getUnlockedLeadIds,
  insufficientCreditsPayload,
  unlockLeads,
} from "@/lib/lead-access";
import { CREDIT_COSTS } from "@/lib/constants";

type Scope = "all" | "saved" | "hot";

async function loadUserLeads(userId: string, scope: Scope) {
  if (scope === "saved") {
    const saved = await prisma.savedLead.findMany({
      where: { userId },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    return saved.map((s) => s.lead);
  }

  if (scope === "hot") {
    return prisma.lead.findMany({
      where: {
        qualityTier: "hot",
        search: { userId },
      },
      orderBy: { leadScore: "desc" },
      take: 5000,
    });
  }

  return prisma.lead.findMany({
    where: { search: { userId } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
}

function exportResponse(leads: ExportLead[], format: "csv" | "xlsx") {
  if (format === "xlsx") {
    return leadsToExcel(leads).then(
      (buffer) =>
        new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="leadflow-export.xlsx"`,
          },
        }),
    );
  }

  const csv = leadsToCsv(leads);
  return Promise.resolve(
    new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leadflow-export.csv"`,
      },
    }),
  );
}

async function chargeUnlocksForExport(userId: string, leadIds: string[]) {
  const unlocked = await getUnlockedLeadIds(userId, leadIds);
  const locked = leadIds.filter((id) => !unlocked.has(id));
  if (!locked.length) {
    return { ok: true as const, charged: 0 };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true },
  });
  const needed =
    Math.round(CREDIT_COSTS.lead * locked.length * 100) / 100;
  const balance = user?.creditsRemaining ?? 0;
  if (balance < needed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ...insufficientCreditsPayload(needed, balance),
          lockedCount: locked.length,
          tip: "Unlock fewer leads, or upgrade your plan on Billing.",
        },
        { status: 402 },
      ),
    };
  }

  try {
    const result = await unlockLeads({ userId, leadIds: locked });
    return { ok: true as const, charged: result.charged };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unlock failed";
    if (message === "INSUFFICIENT_CREDITS") {
      return {
        ok: false as const,
        response: NextResponse.json(
          insufficientCreditsPayload(needed, balance),
          { status: 402 },
        ),
      };
    }
    throw err;
  }
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const scopeParam = searchParams.get("scope") ?? "all";
  const scope: Scope =
    scopeParam === "saved" || scopeParam === "hot" ? scopeParam : "all";

  const leads = await loadUserLeads(user.id, scope);
  if (!leads.length) {
    return NextResponse.json({ error: "No leads to export" }, { status: 400 });
  }

  const billed = await chargeUnlocksForExport(
    user.id,
    leads.map((l) => l.id),
  );
  if (!billed.ok) return billed.response;

  await prisma.export.create({
    data: {
      userId: user.id,
      format,
      leadIds: JSON.stringify(leads.map((l) => l.id)),
    },
  });

  await logActivity(
    user.id,
    "export",
    `Exported ${leads.length} ${scope} leads as ${format}${
      billed.charged ? ` (unlocked ${billed.charged} credits)` : ""
    }`,
  );

  return exportResponse(leads as ExportLead[], format);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const format = body.format === "xlsx" ? "xlsx" : "csv";
  const leadIds = Array.isArray(body.leadIds) ? body.leadIds : [];

  if (leadIds.length === 0) {
    return NextResponse.json({ error: "No leads selected" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: {
      id: { in: leadIds },
      OR: [
        { search: { userId: user.id } },
        { savedBy: { some: { userId: user.id } } },
      ],
    },
  });

  if (!leads.length) {
    return NextResponse.json({ error: "No leads found" }, { status: 404 });
  }

  const billed = await chargeUnlocksForExport(
    user.id,
    leads.map((l) => l.id),
  );
  if (!billed.ok) return billed.response;

  await prisma.export.create({
    data: {
      userId: user.id,
      format,
      leadIds: JSON.stringify(leads.map((l) => l.id)),
    },
  });

  await logActivity(
    user.id,
    "export",
    `Exported ${leads.length} leads as ${format}${
      billed.charged ? ` (unlocked ${billed.charged} credits)` : ""
    }`,
  );

  return exportResponse(leads as ExportLead[], format);
}
