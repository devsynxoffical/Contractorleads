import { NextResponse } from "next/server";
import { getRealSessionUser, isSuperAdmin, stopImpersonation } from "@/lib/auth";
import { logActivity } from "@/lib/credits";

/** Leave a "log in as" session and go back to the admin page it started from. */
export async function POST() {
  const real = await getRealSessionUser();
  if (!real || !isSuperAdmin(real)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { returnTo, targetUserId } = await stopImpersonation();
  if (targetUserId) {
    await logActivity(real.id, "admin_impersonate_exit", `Returned to admin from customer ${targetUserId}`, {
      targetUserId,
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, redirectTo: returnTo });
}
