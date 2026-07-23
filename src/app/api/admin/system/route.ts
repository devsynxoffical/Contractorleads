import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSystemKeyStatuses } from "@/lib/admin";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    keys: getSystemKeyStatuses(),
    note: "Stripe Billing keys can be edited above (or via Admin → System). Other secrets stay in Railway Variables / .env — full values are never shown.",
  });
}
