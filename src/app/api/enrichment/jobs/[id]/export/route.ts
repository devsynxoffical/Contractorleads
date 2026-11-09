import { getSessionUser } from "@/lib/auth";
import { getJobView, jobToCsv, MAX_ROWS_PER_JOB } from "@/lib/enrichment/jobs";

export const dynamic = "force-dynamic";

/** CSV with the original columns plus every accepted field, its source and status. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const view = await getJobView(user.id, id, { rows: true, rowLimit: MAX_ROWS_PER_JOB });
  if (!view) return new Response("Job not found", { status: 404 });
  const name = (view.name || `enrichment-${view.id}`).replace(/[^a-z0-9-_]+/gi, "-").slice(0, 60);
  return new Response(`﻿${jobToCsv(view)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
