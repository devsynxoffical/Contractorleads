import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildMorningDigest } from "@/lib/services/morning-digest";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const digest = await buildMorningDigest(user.id);
  return NextResponse.json({ digest });
}
