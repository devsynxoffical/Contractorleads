import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMetaConfigured } from "@/lib/services/facebook";
import { getSystemKeyStatuses } from "@/lib/admin";

export async function GET() {
  const admin = await requirePermission("health");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let database: { ok: boolean; message: string } = {
    ok: false,
    message: "Not checked",
  };
  try {
    await prisma.user.findFirst({ select: { id: true } });
    database = { ok: true, message: "Connected" };
  } catch (e) {
    database = {
      ok: false,
      message: e instanceof Error ? e.message : "Database error",
    };
  }

  const keys = getSystemKeyStatuses();
  const byKey = Object.fromEntries(keys.map((k) => [k.key, k]));

  const checks = [
    {
      name: "Database",
      status: database.ok ? "ok" : "error",
      detail: database.message,
    },
    {
      name: "Google Places",
      status: byKey.GOOGLE_PLACES_API_KEY?.configured ? "ok" : "missing",
      detail: byKey.GOOGLE_PLACES_API_KEY?.configured
        ? "API key configured"
        : "GOOGLE_PLACES_API_KEY missing",
    },
    {
      name: "OpenAI",
      status: byKey.OPENAI_API_KEY?.configured ? "ok" : "missing",
      detail: byKey.OPENAI_API_KEY?.configured
        ? "API key configured"
        : "OPENAI_API_KEY missing",
    },
    {
      name: "Yelp Fusion",
      status: byKey.YELP_FUSION_API_KEY?.configured ? "ok" : "warn",
      detail: byKey.YELP_FUSION_API_KEY?.configured
        ? "API key configured"
        : "Optional — enrichment limited",
    },
    {
      name: "Serper",
      status: byKey.SERPER_API_KEY?.configured ? "ok" : "warn",
      detail: byKey.SERPER_API_KEY?.configured
        ? "API key configured"
        : "Optional — web search fallback limited",
    },
    {
      name: "Meta / Facebook",
      status: isMetaConfigured() ? "ok" : "warn",
      detail: isMetaConfigured()
        ? "App token or access token configured"
        : "META_* keys missing — Ads Library falls back to public link",
    },
    {
      name: "LinkedIn data API",
      status: byKey.LINKEDIN_DATA_API_KEY?.configured ? "ok" : "warn",
      detail: byKey.LINKEDIN_DATA_API_KEY?.configured
        ? "API key configured"
        : "Optional — LinkedIn enrichment limited",
    },
    {
      name: "Transactional email",
      status:
        byKey.RESEND_API_KEY?.configured || byKey.SENDGRID_API_KEY?.configured
          ? "ok"
          : "warn",
      detail:
        byKey.RESEND_API_KEY?.configured
          ? "Resend configured (signup verification)"
          : byKey.SENDGRID_API_KEY?.configured
            ? "SendGrid configured (signup verification)"
            : "RESEND_API_KEY or SENDGRID_API_KEY missing — verification emails are mocked in logs",
    },
    {
      name: "Places Autocomplete",
      status: byKey.GOOGLE_PLACES_API_KEY?.configured ? "ok" : "missing",
      detail: byKey.GOOGLE_PLACES_API_KEY?.configured
        ? "Uses GOOGLE_PLACES_API_KEY — enable Places API (Autocomplete / Places API New) in Google Cloud"
        : "GOOGLE_PLACES_API_KEY missing — location typeahead disabled",
    },
    {
      name: "JWT secret",
      status: byKey.JWT_SECRET?.configured ? "ok" : "warn",
      detail: byKey.JWT_SECRET?.configured
        ? "Configured"
        : "Using fallback secret — set JWT_SECRET in production",
    },
    {
      name: "App URL",
      status: byKey.NEXT_PUBLIC_APP_URL?.configured ? "ok" : "warn",
      detail: byKey.NEXT_PUBLIC_APP_URL?.configured
        ? "Configured (needed for verification email links)"
        : "NEXT_PUBLIC_APP_URL not set — verification links may point to localhost",
    },
  ];

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    checks,
  });
}
