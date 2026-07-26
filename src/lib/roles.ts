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
export const OWNER_EMAIL = "admin@contractorleads.us";
