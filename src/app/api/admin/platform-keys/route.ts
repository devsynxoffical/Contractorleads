import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  getPlatformKeyStatuses,
  PLATFORM_KEY_FIELDS,
  savePlatformKeyConfig,
  type PlatformKeyInput,
} from "@/lib/platform-keys";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    keys: await getPlatformKeyStatuses(),
    note: "Platform API secrets are editable here. Empty fields fall back to host env (Railway / .env). Full values are never shown.",
  });
}

export async function PUT(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const input: PlatformKeyInput = {};
  for (const field of PLATFORM_KEY_FIELDS) {
    if (typeof body[field] === "string") {
      input[field] = body[field].trim();
    }
  }

  if (Object.keys(input).length === 0) {
    return NextResponse.json(
      { error: "No platform keys provided." },
      { status: 400 },
    );
  }

  await savePlatformKeyConfig(input);

  return NextResponse.json({
    ok: true,
    keys: await getPlatformKeyStatuses(),
  });
}
