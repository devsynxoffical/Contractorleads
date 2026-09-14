import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findEmailsForDomain } from "@/lib/email-finder";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const domain = String(body.domain || body.website || body.query || "").trim();

  if (!domain) {
    return NextResponse.json(
      { error: "Please provide a website URL or company domain" },
      { status: 400 },
    );
  }

  try {
    const result = await findEmailsForDomain(domain, {
      verifyResults: body.verify !== false,
      maxPages: 4,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email search failed" },
      { status: 500 },
    );
  }
}
