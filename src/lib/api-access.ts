import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  defaultApiLimitForPlan as planApiLimit,
  featuresForPlan,
} from "@/lib/plans";

export type IntegrationKind = "api" | "mcp" | "sso";

const API_KEY_PREFIX = "lf_live_";

function monthStartUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function hashApiKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function createApiKey() {
  const token = crypto.randomBytes(24).toString("base64url");
  const raw = `${API_KEY_PREFIX}${token}`;
  return { raw, hash: hashApiKey(raw), last4: raw.slice(-4) };
}

export function timingSafeKeyEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function defaultApiLimitForPlan(plan: string) {
  return planApiLimit(plan);
}

export function planFeatureEnabled(plan: string, kind: IntegrationKind) {
  return Boolean(featuresForPlan(plan)[kind]);
}

/** Flags to apply when a customer's plan changes (admin can still override later). */
export function integrationFlagsForPlan(plan: string) {
  const features = featuresForPlan(plan);
  return {
    apiEnabled: features.api,
    mcpEnabled: features.mcp,
    ssoEnabled: features.sso,
    apiMonthlyLimit: defaultApiLimitForPlan(plan),
  };
}

export function isIntegrationToggleOn(
  user: {
    apiEnabled: boolean;
    mcpEnabled: boolean;
    ssoEnabled: boolean;
  },
  kind: IntegrationKind,
) {
  if (kind === "api") return user.apiEnabled;
  if (kind === "mcp") return user.mcpEnabled;
  return user.ssoEnabled;
}

export async function assertIntegrationEnabledForUser(userId: string, kind: IntegrationKind) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      role: true,
      isActive: true,
      apiEnabled: true,
      mcpEnabled: true,
      ssoEnabled: true,
      apiMonthlyLimit: true,
      apiMonthlyUsed: true,
      apiUsageResetAt: true,
    },
  });
  if (!user || user.isActive === false) {
    return { ok: false as const, error: "Account inactive" };
  }

  const isStaff =
    user.role === "SUPER_ADMIN" ||
    user.role === "MANAGER" ||
    user.role === "SUB_ADMIN";

  // Super admin / staff always have API + MCP + SSO (plan display is informational)
  if (isStaff) {
    return { ok: true as const, user };
  }

  if (!planFeatureEnabled(user.plan, kind)) {
    return {
      ok: false as const,
      error: `${kind.toUpperCase()} is not available on the ${user.plan} plan`,
    };
  }
  if (!isIntegrationToggleOn(user, kind)) {
    return {
      ok: false as const,
      error: `${kind.toUpperCase()} access disabled by admin`,
    };
  }
  return { ok: true as const, user };
}

export async function consumeApiUsage(userId: string, units = 1) {
  const now = new Date();
  const firstOfThisMonth = monthStartUtc(now);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        apiMonthlyLimit: true,
        apiMonthlyUsed: true,
        apiUsageResetAt: true,
      },
    });
    if (!user) return { ok: false as const, error: "User not found" };

    const needsReset =
      !user.apiUsageResetAt || user.apiUsageResetAt.getTime() < firstOfThisMonth.getTime();
    const currentUsed = needsReset ? 0 : user.apiMonthlyUsed;
    const limit = user.apiMonthlyLimit ?? defaultApiLimitForPlan(user.plan);

    if (currentUsed + units > limit) {
      return {
        ok: false as const,
        error: `Plan API limit reached (${currentUsed}/${limit})`,
        used: currentUsed,
        limit,
      };
    }

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        apiMonthlyUsed: currentUsed + units,
        apiUsageResetAt: firstOfThisMonth,
      },
      select: { apiMonthlyUsed: true },
    });
    return { ok: true as const, used: updated.apiMonthlyUsed, limit };
  });
}
