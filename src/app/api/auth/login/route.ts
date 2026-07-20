import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  isAdminStaff,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { linkMarketingVisitorToUser } from "@/lib/marketing-session";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: String(email ?? "").trim().toLowerCase() },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (isAdminStaff(user)) {
      return NextResponse.json(
        {
          error:
            "Admin staff must sign in at /admin/login — this portal is for agencies only.",
        },
        { status: 403 },
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        {
          error:
            "This account is suspended. Contact support if you believe this is a mistake.",
        },
        { status: 403 },
      );
    }

    // Legacy accounts (created before verify-first signup) may lack emailVerifiedAt.
    if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: user.createdAt },
      });
    }

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
    try {
      await linkMarketingVisitorToUser(user.id, user.email);
    } catch {
      /* non-blocking */
    }

    return NextResponse.json({ ok: true, redirectTo: "/auth/splash" });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
