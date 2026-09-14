import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { verifyEmailBatch } from "@/lib/email-verifier";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const emails = (Array.isArray(body.emails)
    ? body.emails.map((e: unknown) => String(e)).filter(Boolean)
    : []) as string[];

  if (!emails.length) {
    return NextResponse.json({ error: "Provide at least one email address" }, { status: 400 });
  }

  if (emails.length > 200) {
    return NextResponse.json(
      { error: "You can verify up to 200 emails per batch" },
      { status: 400 },
    );
  }

  try {
    const summary = await verifyEmailBatch(emails, {
      skipSmtp: Boolean(body.skipSmtp),
      concurrency: 5,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk verification failed" },
      { status: 500 },
    );
  }
}
