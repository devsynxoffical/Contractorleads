import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  requireAdminStaff,
  stopImpersonation,
} from "@/lib/auth";

export async function POST() {
  const admin = await requireAdminStaff();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await stopImpersonation();
  await clearSessionCookie();
  return NextResponse.json({ ok: true, redirectTo: "/admin/login" });
}
