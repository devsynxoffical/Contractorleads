import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { UNIBOX_LABELS } from "@/lib/unibox/labels";

/** All Unibox labels, in display order. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    labels: [...UNIBOX_LABELS]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => ({ id: l.id, name: l.name, color: l.color, autoApplicable: l.auto, meaning: l.meaning, nextAction: l.nextAction })),
  });
}
