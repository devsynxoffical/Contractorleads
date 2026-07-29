import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { prisma } from "@/lib/prisma";
import { getAgencyReportBranding } from "@/lib/agency-branding";
import { LEAD_REPORT_SCRIPT_TYPE } from "@/lib/services/lead-intelligence-report-meta";
import {
  buildLeadReportPdf,
  reportPdfFilename,
} from "@/lib/services/lead-report-pdf";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; scriptId: string }> };

export async function GET(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId, scriptId } = await params;
  const lead = await findAccessibleLead(user, leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const script = await prisma.script.findFirst({
    where: {
      id: scriptId,
      userId: user.id,
      relatedLeadId: leadId,
      type: { startsWith: LEAD_REPORT_SCRIPT_TYPE },
    },
  });
  if (!script) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const preview =
    new URL(request.url).searchParams.get("preview") === "1" ||
    new URL(request.url).searchParams.get("inline") === "1";

  try {
    const branding = await getAgencyReportBranding(user.id);

    const pdf = await buildLeadReportPdf({
      title: script.title || `Intelligence report — ${lead.businessName}`,
      businessName: lead.businessName,
      content: script.content || "",
      generatedAt: script.createdAt,
      agencyName: branding?.companyName || user.companyName || user.name || null,
      branding,
    });

    const filename = reportPdfFilename(lead.businessName, script.title);
    const disposition = preview
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[lead-report-pdf]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not build PDF. Check branding logo and try again.",
      },
      { status: 500 },
    );
  }
}
