import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

/** Meta Ads Library checks are temporarily disabled (Coming soon). */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "Facebook Ads Library checks are coming soon.",
      comingSoon: true,
    },
    { status: 503 },
  );
}
