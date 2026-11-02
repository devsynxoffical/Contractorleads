import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getUserActivityLeaderboard, parsePeriod, parseSort } from "@/lib/admin-user-activity";

export const dynamic = "force-dynamic";

/** Per-user activity leaderboard: emails sent, failures, replies, SMS, searches, exports, credits. */
export async function GET(request: Request) {
  const admin = await requirePermission("activity");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const data = await getUserActivityLeaderboard({
    period: parsePeriod(searchParams.get("period")),
    q: searchParams.get("q") ?? undefined,
    sort: parseSort(searchParams.get("sort")),
    onlyActive: searchParams.get("onlyActive") !== "false",
    page: Number(searchParams.get("page") ?? 1) || 1,
    pageSize: Number(searchParams.get("pageSize") ?? 50) || 50,
  });
  return NextResponse.json(data);
}
