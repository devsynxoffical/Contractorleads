import { NextResponse } from "next/server";
import {
  hashPassword,
  isAdminStaff,
  isOwner,
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

  // Owner accounts can only be edited by the owner themself, and their role
  // never changes. Super Admin accounts are managed exclusively by the Owner.
  if (isOwner(target) && target.id !== admin.id) {
    return NextResponse.json(
      { error: "The Owner account can only be managed by the Owner" },
      { status: 403 },
    );
  }
  if (
    target.role === SUPER_ADMIN_ROLE &&
    target.id !== admin.id &&
    !isOwner(admin)
  ) {
    return NextResponse.json(
      { error: "Only the Owner can manage Super Admin accounts" },
      { status: 403 },
    );
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
    if (isOwner(target)) {
      return NextResponse.json(
        { error: "The Owner role cannot be changed" },
        { status: 400 },
      );
    }
    if (role === SUPER_ADMIN_ROLE && !isOwner(admin)) {
      return NextResponse.json(
        { error: "Only the Owner can grant the Super Admin role" },
        { status: 403 },
      );
    }
    if (
      target.role === SUPER_ADMIN_ROLE &&
      role !== SUPER_ADMIN_ROLE &&
      !isOwner(admin)
    ) {
      return NextResponse.json(
        { error: "Only the Owner can revoke the Super Admin role" },
        { status: 403 },
      );
    }
    if (target.id === admin.id && role !== target.role) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
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

  if (isOwner(target)) {
    return NextResponse.json(
      { error: "The Owner account cannot be deleted" },
      { status: 400 },
    );
  }

  if (target.role === SUPER_ADMIN_ROLE && !isOwner(admin)) {
    return NextResponse.json(
      { error: "Only the Owner can delete Super Admin accounts" },
      { status: 403 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
