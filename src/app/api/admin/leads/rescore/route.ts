import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildAdminLeadWhere,
  parseAdminLeadFilters,
} from "@/lib/admin-lead-filters";
import { scoreLeadFromStoredFields } from "@/lib/services/qualification";

/**
 * Recompute leadScore / qualityTier from stored enrichment fields.
 * Body: { ids?: string[] } — if omitted, rescored all leads matching current filters
 * (pass the same query string as the list page).
 */
export async function POST(request: Request) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let ids: string[] | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      ids?: string[];
    };
    if (Array.isArray(body.ids) && body.ids.length) {
      ids = body.ids.map(String).filter(Boolean).slice(0, 5000);
    }
  } catch {
    /* empty body ok */
  }

  const where = ids?.length
    ? { id: { in: ids } }
    : buildAdminLeadWhere(parseAdminLeadFilters(searchParams));

  const leads = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      googleRating: true,
      reviewCount: true,
      website: true,
      email: true,
      ownerName: true,
      phone: true,
      linkedinUrl: true,
      linkedinCompanyUrl: true,
      linkedinOwnerUrl: true,
      facebook: true,
      instagram: true,
      youtube: true,
      tiktok: true,
      leadScore: true,
      qualityTier: true,
    },
  });

  let updated = 0;
  let unchanged = 0;

  const chunkSize = 50;
  for (let i = 0; i < leads.length; i += chunkSize) {
    const chunk = leads.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (lead) => {
        const scored = scoreLeadFromStoredFields(lead);
        if (
          scored.leadScore === lead.leadScore &&
          scored.qualityTier === lead.qualityTier
        ) {
          unchanged += 1;
          return;
        }
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            leadScore: scored.leadScore,
            qualityTier: scored.qualityTier,
          },
        });
        updated += 1;
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    scanned: leads.length,
    updated,
    unchanged,
  });
}
