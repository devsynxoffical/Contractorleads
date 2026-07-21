import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createApiKey,
  defaultApiLimitForPlan,
  integrationFlagsForPlan,
  planFeatureEnabled,
} from "@/lib/api-access";

async function loadAccess(userId: string) {
  return prisma.user.findUnique({
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
      apiKeyLast4: true,
    },
  });
}

/**
 * Heal stuck accounts: if plan includes API/MCP/SSO but flags were never
 * turned on (old default false), enable them. Never turns flags off.
 */
async function ensurePlanFlagsEnabled(user: NonNullable<Awaited<ReturnType<typeof loadAccess>>>) {
  const flags = integrationFlagsForPlan(user.plan);
  const patch: {
    apiEnabled?: boolean;
    mcpEnabled?: boolean;
    ssoEnabled?: boolean;
    apiMonthlyLimit?: number;
  } = {};

  if (flags.apiEnabled && !user.apiEnabled) patch.apiEnabled = true;
  if (flags.mcpEnabled && !user.mcpEnabled) patch.mcpEnabled = true;
  if (flags.ssoEnabled && !user.ssoEnabled) patch.ssoEnabled = true;
  if (user.apiMonthlyLimit == null) patch.apiMonthlyLimit = flags.apiMonthlyLimit;

  // Staff always get plan features on
  if (
    user.role === "SUPER_ADMIN" ||
    user.role === "MANAGER" ||
    user.role === "SUB_ADMIN"
  ) {
    if (flags.apiEnabled) patch.apiEnabled = true;
    if (flags.mcpEnabled) patch.mcpEnabled = true;
    if (flags.ssoEnabled) patch.ssoEnabled = true;
  }

  if (Object.keys(patch).length === 0) return user;

  return prisma.user.update({
    where: { id: user.id },
    data: patch,
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
      apiKeyLast4: true,
    },
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let fresh = await loadAccess(user.id);
  if (!fresh || fresh.isActive === false) {
    return NextResponse.json({ error: "Account inactive" }, { status: 403 });
  }

  fresh = await ensurePlanFlagsEnabled(fresh);

  const limit = fresh.apiMonthlyLimit ?? defaultApiLimitForPlan(fresh.plan);
  return NextResponse.json({
    plan: fresh.plan,
    planFeatures: {
      api: planFeatureEnabled(fresh.plan, "api"),
      mcp: planFeatureEnabled(fresh.plan, "mcp"),
      sso: planFeatureEnabled(fresh.plan, "sso"),
    },
    access: {
      apiEnabled: fresh.apiEnabled,
      mcpEnabled: fresh.mcpEnabled,
      ssoEnabled: fresh.ssoEnabled,
      apiKeyLast4: fresh.apiKeyLast4,
      apiMonthlyUsed: fresh.apiMonthlyUsed,
      apiMonthlyLimit: limit,
      apiUsageResetAt: fresh.apiUsageResetAt,
    },
  });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let fresh = await loadAccess(user.id);
  if (!fresh || fresh.isActive === false) {
    return NextResponse.json({ error: "Account inactive" }, { status: 403 });
  }

  fresh = await ensurePlanFlagsEnabled(fresh);

  const hasAnyIntegration =
    (planFeatureEnabled(fresh.plan, "api") && fresh.apiEnabled) ||
    (planFeatureEnabled(fresh.plan, "mcp") && fresh.mcpEnabled) ||
    (planFeatureEnabled(fresh.plan, "sso") && fresh.ssoEnabled);

  if (!hasAnyIntegration) {
    return NextResponse.json(
      {
        error:
          "No integration (API, MCP, or SSO) is available on your plan. Upgrade or ask an admin to enable access.",
      },
      { status: 403 },
    );
  }

  const created = createApiKey();
  await prisma.user.update({
    where: { id: fresh.id },
    data: {
      apiKeyHash: created.hash,
      apiKeyLast4: created.last4,
    },
  });

  return NextResponse.json({
    apiKey: created.raw,
    last4: created.last4,
    note: "Store this key now. It will not be shown again.",
  });
}
