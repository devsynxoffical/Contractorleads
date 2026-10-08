import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { syncUserInboxes } from "@/lib/inbox-sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let fetchAll = true;
  let limit = 50;

  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.fetchAll === "boolean") fetchAll = body.fetchAll;
    if (typeof body.limit === "number") limit = body.limit;
  } catch {
    /* fallback to defaults */
  }

  try {
    const result = await syncUserInboxes(user.id, {
      fetchAll,
      limitPerMailbox: limit,
    });
    return NextResponse.json({
      ok: true,
      totalSynced: result.totalSynced,
      mailboxesCount: result.mailboxesCount,
      results: result.results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncUserInboxes(user.id, {
      fetchAll: false,
      limitPerMailbox: 20,
    });
    return NextResponse.json({
      ok: true,
      totalSynced: result.totalSynced,
      mailboxesCount: result.mailboxesCount,
      results: result.results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}

