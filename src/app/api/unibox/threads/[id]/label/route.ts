import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUniboxLabel, isUniboxLabelId } from "@/lib/unibox/labels";
import { setThreadLabel } from "@/lib/unibox/threads";

type Params = { params: Promise<{ id: string }> };

/** PATCH { label_id } — one label per thread; every change is written to the label history. */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { label_id?: unknown; label?: unknown };
  const labelId = body.label_id ?? body.label;
  if (!isUniboxLabelId(labelId)) return NextResponse.json({ error: "Unknown label" }, { status: 400 });
  const updated = await setThreadLabel(user.id, id, labelId);
  if (!updated) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  return NextResponse.json({
    thread_id: updated.id,
    label: labelId,
    label_name: getUniboxLabel(labelId).name,
    updated_at: (updated.labelChangedAt ?? new Date()).toISOString(),
    changed_by: user.id,
  });
}
