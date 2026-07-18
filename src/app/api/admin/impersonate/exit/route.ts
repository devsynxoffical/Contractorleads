import { NextResponse } from "next/server";
import { getRealSessionUser, isSuperAdmin, stopImpersonation } from "@/lib/auth";

export async function POST() {
  const real = await getRealSessionUser();
  if (!real || !isSuperAdmin(real)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await stopImpersonation();
  return NextResponse.json({ ok: true, redirectTo: "/admin/customers" });
}
