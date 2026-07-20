import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const emailsOnly = searchParams.get("emailsOnly") !== "0";
  const take = Math.min(Number(searchParams.get("limit") ?? 100) || 100, 500);

  try {
    const where = emailsOnly
      ? { email: { not: null } }
      : {};

    const [visitors, total, withEmail, optedIn, converted] = await Promise.all([
      prisma.marketingVisitor.findMany({
        where,
        orderBy: { lastSeenAt: "desc" },
        take,
      }),
      prisma.marketingVisitor.count({ where }),
      prisma.marketingVisitor.count({ where: { email: { not: null } } }),
      prisma.marketingVisitor.count({
        where: { email: { not: null }, emailOptIn: true },
      }),
      prisma.marketingVisitor.count({
        where: { convertedUserId: { not: null } },
      }),
    ]);

    return NextResponse.json({
      visitors: visitors.map((v) => ({
        id: v.id,
        visitorKey: v.visitorKey.slice(0, 8) + "…",
        email: v.email,
        emailOptIn: v.emailOptIn,
        source: v.source,
        landingPath: v.landingPath,
        utmSource: v.utmSource,
        utmMedium: v.utmMedium,
        utmCampaign: v.utmCampaign,
        referrer: v.referrer,
        visitCount: v.visitCount,
        firstSeenAt: v.firstSeenAt.toISOString(),
        lastSeenAt: v.lastSeenAt.toISOString(),
        convertedUserId: v.convertedUserId,
        convertedAt: v.convertedAt?.toISOString() ?? null,
      })),
      total,
      stats: {
        withEmail,
        optedIn,
        converted,
        anonymous: Math.max(0, await prisma.marketingVisitor.count() - withEmail),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Query failed";
    const missingTable =
      /MarketingVisitor|does not exist|P2021/i.test(message);
    return NextResponse.json(
      {
        error: missingTable
          ? "MarketingVisitor table missing — restart the app so prisma db push runs, or run: npx prisma db push"
          : "Could not load site leads",
        details: message,
      },
      { status: 500 },
    );
  }
}
