/** Client-safe role constants (no next/headers, no prisma). */
export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
export const MANAGER_ROLE = "MANAGER";
export const SUB_ADMIN_ROLE = "SUB_ADMIN";

export const ADMIN_STAFF_ROLES = [
  SUPER_ADMIN_ROLE,
  MANAGER_ROLE,
  SUB_ADMIN_ROLE,
] as const;
