import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createApiKey,
  defaultApiLimitForPlan,
  planFeatureEnabled,
} from "@/lib/api-access";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
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
  if (!fresh || fresh.isActive === false) {
    return NextResponse.json({ error: "Account inactive" }, { status: 403 });
  }

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

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      plan: true,
      isActive: true,
      apiEnabled: true,
      mcpEnabled: true,
      ssoEnabled: true,
    },
  });
  if (!fresh || fresh.isActive === false) {
    return NextResponse.json({ error: "Account inactive" }, { status: 403 });
  }

  const hasAnyIntegration =
    (planFeatureEnabled(fresh.plan, "api") && fresh.apiEnabled) ||
    (planFeatureEnabled(fresh.plan, "mcp") && fresh.mcpEnabled) ||
    (planFeatureEnabled(fresh.plan, "sso") && fresh.ssoEnabled);

  if (!hasAnyIntegration) {
    return NextResponse.json(
      { error: "No integration (API, MCP, or SSO) is enabled for your workspace." },
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
