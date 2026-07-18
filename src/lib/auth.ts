import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  MANAGER_ROLE,
  SUB_ADMIN_ROLE,
  SUPER_ADMIN_ROLE as PERM_SUPER_ADMIN,
  getRolePermissions,
  userHasPermission,
  type AdminPermissionKey,
} from "@/lib/admin-permissions";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "leadflow-dev-secret-change-in-production",
);

const COOKIE_NAME = "leadflow_session";
const IMPERSONATE_COOKIE = "leadflow_impersonate";
const SESSION_DURATION = "7d";

export const SUPER_ADMIN_ROLE = PERM_SUPER_ADMIN;
export { MANAGER_ROLE, SUB_ADMIN_ROLE };

export const ADMIN_STAFF_ROLES = [
  SUPER_ADMIN_ROLE,
  MANAGER_ROLE,
  SUB_ADMIN_ROLE,
] as const;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  creditsRemaining: number;
  onboardingComplete: boolean;
  darkMode: boolean;
  companyName: string | null;
  businessDescription: string | null;
  services: string | null;
  idealCustomer: string | null;
  serviceAreas: string | null;
  mainGoal: string | null;
  subscriptionStatus?: string | null;
  isActive?: boolean;
  adminNotes?: string | null;
  /** Permission keys for admin staff (empty for agency users) */
  permissions?: AdminPermissionKey[];
  /** True when a SUPER_ADMIN is viewing the app as this customer */
  impersonating?: boolean;
  /** Real admin id when impersonating */
  realAdminId?: string;
};

function toSessionUser(
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    plan: string;
    creditsRemaining: number;
    onboardingComplete: boolean;
    darkMode: boolean;
    companyName: string | null;
    businessDescription: string | null;
    services: string | null;
    idealCustomer: string | null;
    serviceAreas: string | null;
    mainGoal: string | null;
    subscriptionStatus?: string | null;
    isActive?: boolean;
    adminNotes?: string | null;
  },
  extras?: Partial<SessionUser>,
): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    creditsRemaining: user.creditsRemaining,
    onboardingComplete: user.onboardingComplete,
    darkMode: user.darkMode,
    companyName: user.companyName,
    businessDescription: user.businessDescription,
    services: user.services,
    idealCustomer: user.idealCustomer,
    serviceAreas: user.serviceAreas,
    mainGoal: user.mainGoal,
    subscriptionStatus: user.subscriptionStatus ?? null,
    isActive: user.isActive ?? true,
    adminNotes: user.adminNotes ?? null,
    ...extras,
  };
}

export function isSuperAdmin(user: { role: string } | null | undefined) {
  return user?.role === SUPER_ADMIN_ROLE;
}

export function isAdminStaff(user: { role: string } | null | undefined) {
  return (
    !!user &&
    ADMIN_STAFF_ROLES.includes(user.role as (typeof ADMIN_STAFF_ROLES)[number])
  );
}

export function isAgencyUser(user: { role: string } | null | undefined) {
  return !!user && !isAdminStaff(user);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Session from JWT only — ignores impersonation. */
export async function getRealSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub;
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.isActive === false) return null;

    const permissions = isAdminStaff(user)
      ? await getRolePermissions(user.role)
      : [];

    return toSessionUser(user, { permissions });
  } catch {
    return null;
  }
}

/**
 * Effective session user. When a SUPER_ADMIN is impersonating a customer,
 * returns that customer (with impersonating flags).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const real = await getRealSessionUser();
  if (!real) return null;

  const cookieStore = await cookies();
  const targetId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (!targetId || !isSuperAdmin(real)) {
    return real;
  }

  if (targetId === real.id) return real;

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || isAdminStaff(target)) {
    cookieStore.delete(IMPERSONATE_COOKIE);
    return real;
  }

  return toSessionUser(target, {
    impersonating: true,
    realAdminId: real.id,
    permissions: [],
  });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser | null> {
  const real = await getRealSessionUser();
  if (!real || !isSuperAdmin(real)) return null;
  return real;
}

export async function requireAdminStaff(): Promise<SessionUser | null> {
  const real = await getRealSessionUser();
  if (!real || !isAdminStaff(real)) return null;
  return real;
}

export async function requirePermission(
  permission: AdminPermissionKey
): Promise<SessionUser | null> {
  const real = await requireAdminStaff();
  if (!real) return null;
  if (!(await userHasPermission(real, permission))) return null;
  return real;
}

export async function startImpersonation(targetUserId: string) {
  const admin = await requireSuperAdmin();
  if (!admin) throw new Error("FORBIDDEN");

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("NOT_FOUND");
  if (isAdminStaff(target)) throw new Error("CANNOT_IMPERSONATE_ADMIN");

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

export function buildBusinessContext(user: SessionUser) {
  return [
    user.companyName && `Company: ${user.companyName}`,
    user.businessDescription && `Description: ${user.businessDescription}`,
    user.services && `Services: ${user.services}`,
    user.idealCustomer && `Ideal customer: ${user.idealCustomer}`,
    user.serviceAreas && `Service areas: ${user.serviceAreas}`,
    user.mainGoal && `Main goal: ${user.mainGoal}`,
  ]
    .filter(Boolean)
    .join("\n");
}
