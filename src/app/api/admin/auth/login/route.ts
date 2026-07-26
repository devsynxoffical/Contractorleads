import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  isAdminStaff,
  setSessionCookie,
  stopImpersonation,
  verifyPassword,
} from "@/lib/auth";
import { guardAuthRoute, resetRateLimit } from "@/lib/rate-limit";
import { OWNER_EMAIL, OWNER_ROLE } from "@/lib/roles";

/**
 * Dedicated admin login — OWNER, SUPER_ADMIN, MANAGER, and SUB_ADMIN only.
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

    const normalizedEmail = String(email).trim().toLowerCase();

    const { blocked, keys } = guardAuthRoute(request, "admin-login", {
      limit: 5,
      windowMs: 15 * 60 * 1000,
      identifier: normalizedEmail,
    });
    if (blocked) return blocked;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // The platform owner account always holds the OWNER role.
    if (user.email === OWNER_EMAIL && user.role !== OWNER_ROLE) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: OWNER_ROLE },
      });
      user.role = OWNER_ROLE;
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

    keys.forEach(resetRateLimit);

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
