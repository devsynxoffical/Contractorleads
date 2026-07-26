import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  disconnectFacebook,
  getFacebookConnection,
} from "@/lib/facebook-oauth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await getFacebookConnection(user.id);
  return NextResponse.json(connection);
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await disconnectFacebook(user.id);
    return NextResponse.json({ ok: true, connected: false });
  } catch (err) {
    console.error("[facebook] disconnect", err);
    return NextResponse.json(
      { error: "Could not disconnect Facebook. Try again." },
      { status: 500 },
    );
  }
}
