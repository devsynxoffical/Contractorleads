import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { replyToLeadEmail } from "@/lib/lead-email";

type Params = { params: Promise<{ id: string }> };

/** Reply to an inbox / lead email from the agency SMTP mailbox. */
export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const result = await replyToLeadEmail({
      userId: user.id,
      emailId: id,
      body: String(body.body || ""),
      subject: typeof body.subject === "string" ? body.subject : undefined,
      smtpAccountId:
        typeof body.smtpAccountId === "string" ? body.smtpAccountId : null,
    });
    return NextResponse.json({
      ok: true,
      email: result.email,
      status: result.status,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reply failed" },
      { status: 400 },
    );
  }
}
