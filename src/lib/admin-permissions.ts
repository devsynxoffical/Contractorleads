import { prisma } from "@/lib/prisma";
import {
  MANAGER_ROLE,
  SUB_ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
} from "@/lib/roles";

export { MANAGER_ROLE, SUB_ADMIN_ROLE, SUPER_ADMIN_ROLE };

export const ADMIN_PERMISSIONS = [
  { key: "overview", label: "Business Overview", href: "/admin" },
  { key: "platform", label: "Platform Control", href: "/admin/platform" },
  { key: "customers", label: "Customers", href: "/admin/customers" },
  { key: "leads", label: "All Leads", href: "/admin/leads" },
  { key: "leads_export", label: "Lead exports (CSV / Excel)", href: null },
  { key: "saved_leads", label: "Saved Leads", href: "/admin/saved-leads" },
  { key: "searches", label: "All Searches", href: "/admin/searches" },
  { key: "scrape", label: "Scrape Leads", href: "/admin/scrape" },
  { key: "copy_leads", label: "Copy Leads", href: "/admin/copy-leads" },
  { key: "plans", label: "Plans & Entitlements", href: "/admin/plans" },
  { key: "revenue", label: "Revenue & Subscriptions", href: "/admin/revenue" },
  { key: "referrals", label: "Referrals & Affiliates", href: "/admin/referrals" },
  { key: "communications", label: "Email & Outreach", href: "/admin/communications" },
  { key: "exports", label: "Exports Log", href: "/admin/exports" },
  { key: "activity", label: "Activity Log", href: "/admin/activity" },
  { key: "health", label: "Feature Health Audit", href: "/admin/health" },
  { key: "system", label: "System & API Keys", href: "/admin/system" },
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number]["key"];

export const TEMPLATE_ROLES = [MANAGER_ROLE, SUB_ADMIN_ROLE] as const;
export type TemplateRole = (typeof TEMPLATE_ROLES)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<TemplateRole, AdminPermissionKey[]> =
  {
    [MANAGER_ROLE]: ADMIN_PERMISSIONS.filter((p) => p.key !== "system").map(
      (p) => p.key
    ),
    [SUB_ADMIN_ROLE]: [
      "overview",
      "platform",
      "customers",
      "leads",
      "leads_export",
      "saved_leads",
      "searches",
      "scrape",
      "plans",
      "communications",
      "exports",
      "activity",
    ],
  };

export const ROLE_LABELS: Record<TemplateRole, string> = {
  [MANAGER_ROLE]: "Manager",
  [SUB_ADMIN_ROLE]: "Sub Admin",
};

/** Map admin console path → required permission. */
export const PATH_PERMISSION: Array<{
  prefix: string;
  permission: AdminPermissionKey | "staff";
}> = [
  { prefix: "/admin/team", permission: "staff" },
  { prefix: "/admin/platform", permission: "platform" },
  { prefix: "/admin/plans", permission: "plans" },
  { prefix: "/admin/communications", permission: "communications" },
  { prefix: "/admin/exports", permission: "exports" },
  { prefix: "/admin/customers", permission: "customers" },
  { prefix: "/admin/site-leads", permission: "customers" },
  { prefix: "/admin/leads", permission: "leads" },
  { prefix: "/admin/saved-leads", permission: "saved_leads" },
  { prefix: "/admin/searches", permission: "searches" },
  { prefix: "/admin/scrape", permission: "scrape" },
  { prefix: "/admin/copy-leads", permission: "copy_leads" },
  { prefix: "/admin/revenue", permission: "revenue" },
  { prefix: "/admin/referrals", permission: "referrals" },
  { prefix: "/admin/activity", permission: "activity" },
  { prefix: "/admin/health", permission: "health" },
  { prefix: "/admin/email-preview", permission: "system" },
  { prefix: "/admin/system", permission: "system" },
  { prefix: "/admin", permission: "overview" },
];

export function parsePermissions(
  raw: string | null | undefined
): AdminPermissionKey[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set(ADMIN_PERMISSIONS.map((p) => p.key));
    return parsed.filter(
      (k): k is AdminPermissionKey =>
        typeof k === "string" && allowed.has(k as AdminPermissionKey)
    );
  } catch {
    return [];
  }
}

export function isTemplateRole(role: string): role is TemplateRole {
  return role === MANAGER_ROLE || role === SUB_ADMIN_ROLE;
}

export async function ensureRoleTemplates() {
  for (const role of TEMPLATE_ROLES) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role];
    const existing = await prisma.adminRoleTemplate.findUnique({
      where: { role },
    });
    if (!existing) {
      await prisma.adminRoleTemplate.create({
        data: {
          role,
          label: ROLE_LABELS[role],
          permissions: JSON.stringify(defaults),
        },
      });
      continue;
    }
    // Merge newly added permission keys into existing templates
    const current = parsePermissions(existing.permissions);
    const missing = defaults.filter((k) => !current.includes(k));
    if (missing.length) {
      await prisma.adminRoleTemplate.update({
        where: { role },
        data: {
          permissions: JSON.stringify([...current, ...missing]),
        },
      });
    }
  }
}

export async function getRolePermissions(
  role: string
): Promise<AdminPermissionKey[]> {
  if (role === SUPER_ADMIN_ROLE) {
    return ADMIN_PERMISSIONS.map((p) => p.key);
  }
  if (!isTemplateRole(role)) return [];

  await ensureRoleTemplates();
  const template = await prisma.adminRoleTemplate.findUnique({
    where: { role },
  });
  if (!template) return DEFAULT_ROLE_PERMISSIONS[role];
  return parsePermissions(template.permissions);
}

export async function userHasPermission(
  user: { role: string } | null | undefined,
  permission: AdminPermissionKey
): Promise<boolean> {
  if (!user) return false;
  if (user.role === SUPER_ADMIN_ROLE) return true;
  const perms = await getRolePermissions(user.role);
  return perms.includes(permission);
}

export function permissionForPath(
  pathname: string
): AdminPermissionKey | "staff" | null {
  const match = PATH_PERMISSION.find((p) => {
    if (p.prefix === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname === p.prefix || pathname.startsWith(`${p.prefix}/`);
  });
  return match?.permission ?? null;
}

export function firstAllowedAdminPath(
  permissions: AdminPermissionKey[]
): string {
  for (const item of ADMIN_PERMISSIONS) {
    if (item.href && permissions.includes(item.key)) return item.href;
  }
  return "/admin/login";
}
