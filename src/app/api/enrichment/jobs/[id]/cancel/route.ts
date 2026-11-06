import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { cancelEnrichmentJob } from "@/lib/enrichment/jobs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await cancelEnrichmentJob(user.id, id);
  if (!ok) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
