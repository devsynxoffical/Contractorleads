/** Client-safe role constants (no next/headers, no prisma). */
export const OWNER_ROLE = "OWNER";
export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
export const MANAGER_ROLE = "MANAGER";
export const SUB_ADMIN_ROLE = "SUB_ADMIN";

export const ADMIN_STAFF_ROLES = [
  OWNER_ROLE,
  SUPER_ADMIN_ROLE,
  MANAGER_ROLE,
  SUB_ADMIN_ROLE,
] as const;

/** The platform owner account — auto-promoted to OWNER on admin login. */
export const OWNER_EMAIL = "hello@contractorleads.us";

/**
 * Strict Super Admin check for global system mailbox and infrastructure access.
 * ONLY the platform owner or explicit SUPER_ADMIN has access to all global mailboxes.
 * All other users (including staff, sub-admins, managers, and agency customers)
 * can ONLY see and use mailboxes explicitly assigned to their user ID.
 */
export function isGlobalSuperAdmin(user?: { role?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  const role = (user.role || "").toUpperCase().trim();
  return email === OWNER_EMAIL.toLowerCase() || role === OWNER_ROLE || role === SUPER_ADMIN_ROLE;
}
