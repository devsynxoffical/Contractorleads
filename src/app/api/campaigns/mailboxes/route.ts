import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getCampaignMailboxStats } from "@/lib/campaign-engine";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getCampaignMailboxStats(user.id);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load mailboxes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
