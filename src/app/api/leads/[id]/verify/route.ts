import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { computeVerificationScore } from "@/lib/services/social-enrichment";
import { findAccessibleLead } from "@/lib/lead-ownership";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const verificationScore = computeVerificationScore(lead);

  return NextResponse.json({
    verificationScore,
    status: verificationScore >= 80 ? "verified" : "partial",
    message:
      verificationScore >= 80
        ? "Contact and social details cross-referenced successfully."
        : "Some contact or social fields are missing — run Fetch on social profiles to improve score.",
  });
}
