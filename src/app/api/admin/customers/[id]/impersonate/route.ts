import { NextResponse } from "next/server";
import { requireSuperAdmin, startImpersonation } from "@/lib/auth";
import { logActivity } from "@/lib/credits";

type Params = { params: Promise<{ id: string }> };

/** Super Admin / Owner: log in as a customer. Body may carry `returnTo` (an /admin path). */
export async function POST(request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { returnTo?: unknown };

  try {
    await startImpersonation(id, typeof body.returnTo === "string" ? body.returnTo : undefined);
    await logActivity(admin.id, "admin_impersonate", `Logged in as customer ${id}`, {
      targetUserId: id,
    });
    return NextResponse.json({ ok: true, redirectTo: "/home" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Impersonation failed";
    const status =
      message === "NOT_FOUND"
        ? 404
        : message === "CANNOT_IMPERSONATE_ADMIN"
          ? 400
          : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
