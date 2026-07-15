import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "leadflow-dev-secret-change-in-production"
);

const COOKIE_NAME = "leadflow_session";
const SESSION_DURATION = "7d";

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
};

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

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub;
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

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
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
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
