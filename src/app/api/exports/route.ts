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

function exportResponse(
  leads: ExportLead[],
  format: "csv" | "xlsx",
  meta?: {
    requested: number;
    exported: number;
    skippedForCredits: number;
    charged: number;
  },
) {
  const headers: Record<string, string> = {};
  if (meta) {
    headers["X-Export-Requested"] = String(meta.requested);
    headers["X-Export-Count"] = String(meta.exported);
    headers["X-Export-Skipped"] = String(meta.skippedForCredits);
    headers["X-Export-Charged"] = String(meta.charged);
  }

  if (format === "xlsx") {
    return leadsToExcel(leads).then(
      (buffer) =>
        new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="leadflow-export.xlsx"`,
            ...headers,
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
        ...headers,
      },
    }),
  );
}

/**
 * View is free. Credits are spent only when exporting.
 * Already-exported leads re-export free. New exports cost CREDIT_COSTS.lead each,
 * limited by remaining balance (partial export when credits < locked count).
 */
async function billAndSelectForExport<T extends { id: string }>(
  userId: string,
  leads: T[],
) {
  const ids = leads.map((l) => l.id);
  const unlocked = await getUnlockedLeadIds(userId, ids);
  const alreadyPaid = leads.filter((l) => unlocked.has(l.id));
  const unpaid = leads.filter((l) => !unlocked.has(l.id));

  if (!unpaid.length) {
    return {
      ok: true as const,
      exportLeads: leads,
      charged: 0,
      skippedForCredits: 0,
      requested: leads.length,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true },
  });
  const balance = user?.creditsRemaining ?? 0;
  const maxAffordable = Math.floor(balance / CREDIT_COSTS.lead + 1e-9);

  if (maxAffordable <= 0 && alreadyPaid.length === 0) {
    const needed =
      Math.round(CREDIT_COSTS.lead * unpaid.length * 100) / 100;
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ...insufficientCreditsPayload(needed, balance),
          lockedCount: unpaid.length,
          maxExportable: 0,
          tip: "Purchase credits on Billing, then export. Search and viewing stay free.",
        },
        { status: 402 },
      ),
    };
  }

  const toCharge = unpaid.slice(0, Math.max(0, maxAffordable));
  const skipped = unpaid.slice(toCharge.length);
  const exportLeads = [...alreadyPaid, ...toCharge];

  let charged = 0;
  if (toCharge.length) {
    try {
      const result = await unlockLeads({
        userId,
        leadIds: toCharge.map((l) => l.id),
      });
      charged = result.charged;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export billing failed";
      if (message === "INSUFFICIENT_CREDITS") {
        const needed =
          Math.round(CREDIT_COSTS.lead * toCharge.length * 100) / 100;
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

  return {
    ok: true as const,
    exportLeads,
    charged,
    skippedForCredits: skipped.length,
    requested: leads.length,
  };
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

  const billed = await billAndSelectForExport(user.id, leads);
  if (!billed.ok) return billed.response;

  const exportLeads = billed.exportLeads;
  await prisma.export.create({
    data: {
      userId: user.id,
      format,
      leadIds: JSON.stringify(exportLeads.map((l) => l.id)),
    },
  });

  const skipNote = billed.skippedForCredits
    ? ` · ${billed.skippedForCredits} skipped (credits)`
    : "";
  await logActivity(
    user.id,
    "export",
    `Exported ${exportLeads.length}/${billed.requested} ${scope} leads as ${format}${
      billed.charged ? ` (${billed.charged} credits)` : ""
    }${skipNote}`,
  );

  return exportResponse(exportLeads as ExportLead[], format, {
    requested: billed.requested,
    exported: exportLeads.length,
    skippedForCredits: billed.skippedForCredits,
    charged: billed.charged,
  });
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

  // Preserve request order when possible
  const byId = new Map(leads.map((l) => [l.id, l]));
  const ordered = (leadIds as string[])
    .map((id) => byId.get(id))
    .filter((l): l is (typeof leads)[number] => Boolean(l));

  const billed = await billAndSelectForExport(user.id, ordered);
  if (!billed.ok) return billed.response;

  const exportLeads = billed.exportLeads;
  await prisma.export.create({
    data: {
      userId: user.id,
      format,
      leadIds: JSON.stringify(exportLeads.map((l) => l.id)),
    },
  });

  const skipNote = billed.skippedForCredits
    ? ` · ${billed.skippedForCredits} skipped (credits)`
    : "";
  await logActivity(
    user.id,
    "export",
    `Exported ${exportLeads.length}/${billed.requested} leads as ${format}${
      billed.charged ? ` (${billed.charged} credits)` : ""
    }${skipNote}`,
  );

  return exportResponse(exportLeads as unknown as ExportLead[], format, {
    requested: billed.requested,
    exported: exportLeads.length,
    skippedForCredits: billed.skippedForCredits,
    charged: billed.charged,
  });
}
