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

    return NextResponse.json({ ok: true, visitorKey: visitorKey.slice(0, 8) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("[marketing/session]", message);
    return NextResponse.json(
      {
        error: "Could not record visit",
        hint: /MarketingVisitor|P2021|does not exist/i.test(message)
          ? "Run npx prisma db push (or restart Railway so start script pushes schema)"
          : undefined,
      },
      { status: 500 },
    );
  }
}
