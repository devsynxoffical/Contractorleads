import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
  TEMPLATE_ROLES,
  ensureRoleTemplates,
  isTemplateRole,
  parsePermissions,
  type AdminPermissionKey,
  type TemplateRole,
} from "@/lib/admin-permissions";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureRoleTemplates();
  const templates = await prisma.adminRoleTemplate.findMany({
    orderBy: { role: "asc" },
  });

  return NextResponse.json({
    catalog: ADMIN_PERMISSIONS,
    templates: templates.map((t) => ({
      id: t.id,
      role: t.role,
      label: t.label,
      permissions: parsePermissions(t.permissions),
      updatedAt: t.updatedAt,
    })),
  });
}

export async function PATCH(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const role = String(body.role ?? "");
  if (!isTemplateRole(role)) {
    return NextResponse.json(
      { error: "Role must be MANAGER or SUB_ADMIN" },
      { status: 400 },
    );
  }

  const allowed = new Set(ADMIN_PERMISSIONS.map((p) => p.key));
  const permissions = (Array.isArray(body.permissions) ? body.permissions : [])
    .filter((k: unknown): k is AdminPermissionKey =>
      typeof k === "string" && allowed.has(k as AdminPermissionKey),
    ) as AdminPermissionKey[];

  await ensureRoleTemplates();
  const template = await prisma.adminRoleTemplate.upsert({
    where: { role },
    update: {
      label: ROLE_LABELS[role as TemplateRole],
      permissions: JSON.stringify(permissions),
    },
    create: {
      role,
      label: ROLE_LABELS[role as TemplateRole],
      permissions: JSON.stringify(
        permissions.length
          ? permissions
          : DEFAULT_ROLE_PERMISSIONS[role as TemplateRole],
      ),
    },
  });

  return NextResponse.json({
    template: {
      id: template.id,
      role: template.role,
      label: template.label,
      permissions: parsePermissions(template.permissions),
      updatedAt: template.updatedAt,
    },
    roles: TEMPLATE_ROLES,
  });
}
