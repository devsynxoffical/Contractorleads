import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { getSystemKeyStatuses } from "@/lib/admin";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    keys: getSystemKeyStatuses(),
    note: "Secrets are never shown in full. Set them in Railway Variables or local .env — not from this UI.",
  });
}
