import { NextResponse } from "next/server";
import { requireSuperAdmin, startImpersonation } from "@/lib/auth";
import { logActivity } from "@/lib/credits";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await startImpersonation(id);
    await logActivity(admin.id, "admin_impersonate", `Started test as customer ${id}`, {
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
