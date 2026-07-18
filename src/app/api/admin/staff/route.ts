import { NextResponse } from "next/server";
import {
  ADMIN_STAFF_ROLES,
  hashPassword,
  requireSuperAdmin,
  SUPER_ADMIN_ROLE,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTemplateRole } from "@/lib/admin-permissions";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: [...ADMIN_STAFF_ROLES] } },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ staff });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const name = String(body.name ?? "").trim() || null;
  const password = String(body.password ?? "");
  const role = String(body.role ?? "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }
  if (!isTemplateRole(role) && role !== SUPER_ADMIN_ROLE) {
    return NextResponse.json(
      { error: "Role must be MANAGER, SUB_ADMIN, or SUPER_ADMIN" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role,
      plan: "agency",
      subscriptionStatus: "active",
      creditsRemaining: 0,
      onboardingComplete: true,
      companyName: role === SUPER_ADMIN_ROLE ? "Platform Ops" : "Admin Staff",
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ staff: user });
}
