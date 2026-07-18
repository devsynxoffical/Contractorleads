import { NextResponse } from "next/server";
import {
  hashPassword,
  isAdminStaff,
  isSuperAdmin,
  requireSuperAdmin,
  SUPER_ADMIN_ROLE,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTemplateRole } from "@/lib/admin-permissions";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !isAdminStaff(target)) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  if (target.id === admin.id && request.headers.get("x-self-lock") === "1") {
    return NextResponse.json(
      { error: "You cannot modify your own account this way" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const data: {
    name?: string | null;
    role?: string;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (body.name !== undefined) {
    data.name = String(body.name ?? "").trim() || null;
  }
  if (body.role !== undefined) {
    const role = String(body.role);
    if (!isTemplateRole(role) && role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (target.id === admin.id && role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        { error: "You cannot remove your own Super Admin role" },
        { status: 400 },
      );
    }
    data.role = role;
  }
  if (typeof body.isActive === "boolean") {
    if (target.id === admin.id && body.isActive === false) {
      return NextResponse.json(
        { error: "You cannot suspend your own account" },
        { status: 400 },
      );
    }
    data.isActive = body.isActive;
  }
  if (body.password) {
    const password = String(body.password);
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    data.passwordHash = await hashPassword(password);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
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

  return NextResponse.json({ staff: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !isAdminStaff(target)) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  if (target.id === admin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  if (isSuperAdmin(target)) {
    const superCount = await prisma.user.count({
      where: { role: SUPER_ADMIN_ROLE, isActive: true },
    });
    if (superCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last Super Admin" },
        { status: 400 },
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
