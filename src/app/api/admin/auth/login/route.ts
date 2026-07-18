import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  isAdminStaff,
  setSessionCookie,
  stopImpersonation,
  verifyPassword,
} from "@/lib/auth";

/**
 * Dedicated admin login — SUPER_ADMIN, MANAGER, and SUB_ADMIN only.
 * Agency users must use /login (POST /api/auth/login).
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!isAdminStaff(user)) {
      return NextResponse.json(
        {
          error:
            "This portal is for admin staff only. Use the agency login at /login.",
        },
        { status: 403 },
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "This admin account is suspended." },
        { status: 403 },
      );
    }

    await stopImpersonation();
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    const { firstAllowedAdminPath, getRolePermissions } = await import(
      "@/lib/admin-permissions"
    );
    const permissions = await getRolePermissions(user.role);
    const redirectTo = firstAllowedAdminPath(permissions);

    return NextResponse.json({
      ok: true,
      redirectTo: redirectTo === "/admin/login" ? "/admin" : redirectTo,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: "Admin login failed" }, { status: 500 });
  }
}
