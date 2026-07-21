import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { resolveSearchCriteria } from "@/lib/search-criteria";
import {
  assertIntegrationEnabledForUser,
  consumeApiUsage,
  hashApiKey,
  type IntegrationKind,
} from "@/lib/api-access";

function resolveApiKeyFromRequest(request: Request, kind: IntegrationKind) {
  const direct = request.headers.get("x-api-key")?.trim();
  if (direct) return direct;

  if (kind === "sso") {
    const bearer = request.headers.get("authorization")?.trim();
    if (bearer?.toLowerCase().startsWith("bearer ")) {
      return bearer.slice("bearer ".length).trim();
    }
    const ssoToken = request.headers.get("x-sso-token")?.trim();
    if (ssoToken) return ssoToken;
  }

  return null;
}

async function resolveApiUser(request: Request, kind: IntegrationKind) {
  const apiKey = resolveApiKeyFromRequest(request, kind);
  if (!apiKey) {
    return {
      ok: false as const,
      error: kind === "sso" ? "Missing bearer token (SSO) or x-api-key" : "Missing x-api-key header",
      status: 401,
    };
  }
  const hash = hashApiKey(apiKey);
  const user = await prisma.user.findFirst({
    where: { apiKeyHash: hash },
    select: { id: true },
  });
  if (!user) return { ok: false as const, error: "Invalid API key", status: 401 };
  return { ok: true as const, userId: user.id };
}

export async function handlePublicSearch(request: Request, kind: IntegrationKind) {
  const resolvedUser = await resolveApiUser(request, kind);
  if (!resolvedUser.ok) {
    return NextResponse.json({ error: resolvedUser.error }, { status: resolvedUser.status });
  }

  const integration = await assertIntegrationEnabledForUser(resolvedUser.userId, kind);
  if (!integration.ok) {
    return NextResponse.json({ error: integration.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const resolved = resolveSearchCriteria(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_PLACES_API_KEY is not configured" },
        { status: 503 },
      );
    }

    const quota = await consumeApiUsage(integration.user.id, 1);
    if (!quota.ok) {
      return NextResponse.json(
        { error: quota.error, used: quota.used, limit: quota.limit },
        { status: 429 },
      );
    }

    const result = await runLeadPipeline({
      userId: integration.user.id,
      ...resolved.criteria,
    });

    await logActivity(
      integration.user.id,
      "api_search",
      `${kind.toUpperCase()} search generated ${result.leads.length} leads`,
      { searchId: result.search.id, kind, apiUsed: quota.used, apiLimit: quota.limit },
    );

    return NextResponse.json({
      search: result.search,
      leads: result.leads,
      meta: result.meta,
      quota: { used: quota.used, limit: quota.limit },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
