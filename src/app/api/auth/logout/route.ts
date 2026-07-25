import { NextResponse } from "next/server";
import { clearSessionCookie, stopImpersonation } from "@/lib/auth";

export async function POST() {
  await stopImpersonation();
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
