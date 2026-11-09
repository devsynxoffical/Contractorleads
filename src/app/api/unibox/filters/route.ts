import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { filterOptions } from "@/lib/unibox/queries";

export const dynamic = "force-dynamic";

/** Campaign, label and mailbox options with thread counts for the Unibox sidebar. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  return NextResponse.json(
    await filterOptions(user.id, {
      campaignId: url.searchParams.get("campaign_id") || null,
      status: status === "archived" || status === "all" ? status : "open",
    }),
  );
}
