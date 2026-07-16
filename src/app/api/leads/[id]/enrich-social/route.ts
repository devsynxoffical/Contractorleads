import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeVerificationScore,
  enrichLeadSocial,
} from "@/lib/services/social-enrichment";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const result = await enrichLeadSocial(lead);
  const verificationScore = computeVerificationScore(result.lead);

  return NextResponse.json({
    lead: result.lead,
    found: result.found,
    verificationScore,
  });
}
