import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { verifyEmailAddress } from "@/lib/email-verifier";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim();

  if (!email) {
    return NextResponse.json({ error: "Email address is required" }, { status: 400 });
  }

  try {
    const result = await verifyEmailAddress(email, {
      skipSmtp: Boolean(body.skipSmtp),
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 },
    );
  }
}
