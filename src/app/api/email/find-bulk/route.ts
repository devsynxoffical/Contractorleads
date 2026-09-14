import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findEmailsBatch } from "@/lib/email-finder";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const domains = (Array.isArray(body.domains)
    ? body.domains.map((d: unknown) => String(d)).filter(Boolean)
    : []) as string[];

  if (!domains.length) {
    return NextResponse.json(
      { error: "Provide at least one domain or website URL" },
      { status: 400 },
    );
  }

  if (domains.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 domains per batch" },
      { status: 400 },
    );
  }

  try {
    const summary = await findEmailsBatch(domains, {
      verifyResults: body.verify !== false,
      concurrency: 4,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk email search failed" },
      { status: 500 },
    );
  }
}
