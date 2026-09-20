import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { syncUserHostingerMailboxes } from "@/lib/hostinger-imap";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncUserHostingerMailboxes(user.id);
    return NextResponse.json({
      ok: true,
      totalSynced: result.totalSynced,
      results: result.results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
