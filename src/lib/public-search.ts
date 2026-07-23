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
import {
  assertSearchRateLimit,
  redactLeadsForUser,
} from "@/lib/lead-access";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, x-sso-token, X-Api-Key, X-SSO-Token",
  "Access-Control-Max-Age": "86400",
};

export function publicCorsHeaders() {
  return { ...CORS_HEADERS };
}

export function publicOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function jsonWithCors(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: CORS_HEADERS,
  });
}

/**
 * Accept any of:
 * - x-api-key / X-Api-Key
 * - Authorization: Bearer <key>
 * - x-sso-token / X-SSO-Token
 */
export function resolveApiKeyFromRequest(request: Request): string | null {
  const direct =
    request.headers.get("x-api-key")?.trim() ||
    request.headers.get("X-Api-Key")?.trim();
  if (direct) return direct;

  const sso =
    request.headers.get("x-sso-token")?.trim() ||
    request.headers.get("X-SSO-Token")?.trim();
  if (sso) return sso;

  const bearer = request.headers.get("authorization")?.trim();
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    const token = bearer.slice("bearer ".length).trim();
    if (token) return token;
  }

  return null;
}

async function resolveApiUser(request: Request, kind: IntegrationKind) {
  const apiKey = resolveApiKeyFromRequest(request);
  if (!apiKey) {
    return {
      ok: false as const,
      error:
        "Missing API credentials. Send x-api-key, Authorization: Bearer <key>, or x-sso-token.",
      status: 401,
    };
  }
  const hash = hashApiKey(apiKey);
  const user = await prisma.user.findFirst({
    where: { apiKeyHash: hash },
    select: { id: true },
  });
  if (!user) {
    return { ok: false as const, error: "Invalid API key", status: 401 };
  }
  return { ok: true as const, userId: user.id };
}

async function parseJsonBody(request: Request): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; error: string }
> {
  const text = await request.text();
  if (!text.trim()) {
    return {
      ok: false,
      error:
        'Request body required. Example: {"industry":"Roofing","city":"Austin","state":"TX","country":"US","targetLeadCount":10}',
    };
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "JSON body must be an object." };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid JSON body." };
  }
}

/** Lightweight auth + quota check (no search). */
export async function handlePublicPing(request: Request, kind: IntegrationKind) {
  const resolvedUser = await resolveApiUser(request, kind);
  if (!resolvedUser.ok) {
    return jsonWithCors(
      { ok: false, error: resolvedUser.error, kind },
      { status: resolvedUser.status },
    );
  }

  const integration = await assertIntegrationEnabledForUser(
    resolvedUser.userId,
    kind,
  );
  if (!integration.ok) {
    return jsonWithCors(
      { ok: false, error: integration.error, kind },
      { status: 403 },
    );
  }

  return jsonWithCors({
    ok: true,
    kind,
    plan: integration.user.plan,
    quota: {
      used: integration.user.apiMonthlyUsed,
      limit: integration.user.apiMonthlyLimit,
    },
    auth: "valid",
    endpoints: {
      api: "/api/public/leads/search",
      mcp: "/api/public/mcp/search",
      sso: "/api/public/sso/leads/search",
    },
    usage: {
      method: "POST",
      headers: [
        "Content-Type: application/json",
        "x-api-key: <your-key>",
        // or Authorization: Bearer <your-key>
        // or x-sso-token: <your-key>
      ],
      body: {
        industry: "Roofing",
        country: "US",
        state: "TX",
        city: "Austin",
        targetLeadCount: 10,
        requireSocialPresence: false,
      },
    },
  });
}

export async function handlePublicSearch(
  request: Request,
  kind: IntegrationKind,
) {
  const resolvedUser = await resolveApiUser(request, kind);
  if (!resolvedUser.ok) {
    return jsonWithCors(
      { error: resolvedUser.error },
      { status: resolvedUser.status },
    );
  }

  const integration = await assertIntegrationEnabledForUser(
    resolvedUser.userId,
    kind,
  );
  if (!integration.ok) {
    return jsonWithCors({ error: integration.error }, { status: 403 });
  }

  try {
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return jsonWithCors({ error: parsed.error }, { status: 400 });
    }

    // Public integrations default to volume (not strict social filter)
    // unless the caller explicitly sets requireSocialPresence.
    const body = { ...parsed.body };
    if (
      body.requireSocialPresence === undefined ||
      body.requireSocialPresence === null ||
      body.requireSocialPresence === ""
    ) {
      body.requireSocialPresence = false;
    }

    const resolved = resolveSearchCriteria(body);
    if (!resolved.ok) {
      return jsonWithCors({ error: resolved.error }, { status: 400 });
    }
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return jsonWithCors(
        { error: "GOOGLE_PLACES_API_KEY is not configured on the server" },
        { status: 503 },
      );
    }

    const rate = await assertSearchRateLimit(integration.user.id);
    if (!rate.ok) {
      return jsonWithCors({ error: rate.error }, { status: 429 });
    }

    const quota = await consumeApiUsage(integration.user.id, 1);
    if (!quota.ok) {
      return jsonWithCors(
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
      {
        searchId: result.search.id,
        kind,
        apiUsed: quota.used,
        apiLimit: quota.limit,
      },
    );

    const redacted = await redactLeadsForUser(
      integration.user.id,
      result.leads,
    );

    return jsonWithCors({
      ok: true,
      kind,
      search: result.search,
      leads: redacted,
      meta: {
        ...result.meta,
        billing: {
          searchCharged: 0,
          unlockCostPerLead: 1.33,
          note: "Contacts are redacted until unlocked via the app (1.33 credits each).",
        },
      },
      quota: { used: quota.used, limit: quota.limit },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    console.error(`[public-search:${kind}]`, err);
    return jsonWithCors({ error: message, kind }, { status: 500 });
  }
}
