import { NextResponse } from "next/server";
import {
  ensureMarketingVisitorKey,
  touchMarketingVisitor,
} from "@/lib/marketing-session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const visitorKey = await ensureMarketingVisitorKey();

    await touchMarketingVisitor(visitorKey, {
      landingPath: body.landingPath ?? null,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      referrer: body.referrer ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record visit" }, { status: 500 });
  }
}
