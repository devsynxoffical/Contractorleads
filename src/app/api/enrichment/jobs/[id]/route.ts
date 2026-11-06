import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getJobView } from "@/lib/enrichment/jobs";

export const dynamic = "force-dynamic";

/** Job progress; ?rows=1 adds per-row status and per-field provider history. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const url = new URL(request.url);
  const view = await getJobView(user.id, id, {
    rows: url.searchParams.get("rows") === "1",
    rowLimit: Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 200)),
    rowOffset: Math.max(0, Number(url.searchParams.get("offset")) || 0),
  });
  if (!view) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ job: view });
}
