import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DIGEST_LEAD_COUNTS,
  validateDigestSubscription,
} from "@/lib/services/daily-digest";
import { CREDIT_COSTS, INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { getRegionsForCountry } from "@/lib/constants";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subscription, recentDeliveries] = await Promise.all([
    prisma.digestSubscription.findUnique({ where: { userId: user.id } }),
    prisma.digestDelivery.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        leadCount: true,
        creditsCharged: true,
        emailStatus: true,
        error: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    subscription: subscription
      ? {
          enabled: subscription.enabled,
          industry: subscription.industry,
          country: subscription.country,
          locationScope: subscription.locationScope,
          state: subscription.state,
          city: subscription.city,
          dailyLeadCount: subscription.dailyLeadCount,
          timezone: subscription.timezone,
          lastRunAt: subscription.lastRunAt?.toISOString() ?? null,
          lastError: subscription.lastError,
        }
      : null,
    recentDeliveries: recentDeliveries.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    options: {
      industries: INDUSTRIES,
      countries: TIER_ONE_COUNTRIES.map((c) => ({
        code: c.code,
        name: c.name,
        regionLabel: c.regionLabel,
      })),
      leadCounts: DIGEST_LEAD_COUNTS,
      creditCostPerLead: CREDIT_COSTS.lead,
      regionsByCountry: Object.fromEntries(
        TIER_ONE_COUNTRIES.map((c) => [c.code, getRegionsForCountry(c.code)]),
      ),
    },
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = validateDigestSubscription(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const data = validated.data;
  const subscription = await prisma.digestSubscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: {
      ...data,
      lastError: null,
    },
  });

  return NextResponse.json({
    ok: true,
    subscription: {
      enabled: subscription.enabled,
      industry: subscription.industry,
      country: subscription.country,
      locationScope: subscription.locationScope,
      state: subscription.state,
      city: subscription.city,
      dailyLeadCount: subscription.dailyLeadCount,
      timezone: subscription.timezone,
      lastRunAt: subscription.lastRunAt?.toISOString() ?? null,
      lastError: subscription.lastError,
    },
  });
}
