import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listThreads } from "@/lib/unibox/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/unibox/threads?campaign_id=&label=interested,bad_timing&mailbox_id=&q=&unread=1&page=1&limit=50
 * campaign_id=none lists replies that are not linked to a campaign. Labels combine with OR.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = new URL(request.url).searchParams;
  const status = p.get("status");
  const labels = p.getAll("label").flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return NextResponse.json(
    await listThreads(user.id, {
      campaignId: p.get("campaign_id") || null,
      labels,
      mailbox: p.get("mailbox_id") || p.get("mailbox") || null,
      q: p.get("q"),
      unread: p.get("unread") === "1",
      followUpDue: p.get("follow_up") === "due",
      status: status === "archived" || status === "all" ? status : "open",
      page: Number(p.get("page")) || 1,
      limit: Number(p.get("limit")) || 50,
    }),
  );
}
