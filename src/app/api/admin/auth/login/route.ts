import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SUPER_ADMIN_ROLE,
  createSessionToken,
  setSessionCookie,
  stopImpersonation,
  verifyPassword,
} from "@/lib/auth";

/**
 * Dedicated admin login — only SUPER_ADMIN accounts may sign in here.
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

    if (user.role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        {
          error:
            "This portal is for super admins only. Use the agency login at /login.",
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

    return NextResponse.json({
      ok: true,
      redirectTo: "/admin",
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
