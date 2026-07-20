import { NextResponse } from "next/server";
import { captureMarketingEmail } from "@/lib/marketing-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const emailOptIn = body.emailOptIn !== false;
    const source = String(body.source ?? "marketing_site").trim() || "marketing_site";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await captureMarketingEmail({
      email,
      emailOptIn,
      source,
      touch: {
        landingPath: body.landingPath ?? null,
        utmSource: body.utmSource ?? null,
        utmMedium: body.utmMedium ?? null,
        utmCampaign: body.utmCampaign ?? null,
        referrer: body.referrer ?? null,
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_EMAIL") {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save subscription" }, { status: 500 });
  }
}
