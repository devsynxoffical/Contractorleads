import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [bookings, config, total, upcoming] = await Promise.all([
      prisma.enterpriseBooking.findMany({
        orderBy: { scheduledAt: "desc" },
        take: 200,
      }),
      prisma.enterpriseBookingConfig.findUnique({
        where: { id: "default" },
      }),
      prisma.enterpriseBooking.count(),
      prisma.enterpriseBooking.count({
        where: {
          scheduledAt: { gte: new Date() },
          status: { notIn: ["cancelled", "completed"] },
        },
      }),
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        company: b.company,
        phone: b.phone,
        message: b.message,
        scheduledAt: b.scheduledAt.toISOString(),
        timezone: b.timezone,
        status: b.status,
        source: b.source,
        utmSource: b.utmSource,
        utmMedium: b.utmMedium,
        utmCampaign: b.utmCampaign,
        adminNotes: b.adminNotes,
        createdAt: b.createdAt.toISOString(),
      })),
      config: {
        notifyEmail: config?.notifyEmail ?? "hello@contractorleads.us",
        enabled: config?.enabled !== false,
      },
      stats: { total, upcoming },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Query failed";
    const missing = /EnterpriseBooking|does not exist|P2021/i.test(message);
    return NextResponse.json(
      {
        error: missing
          ? "Enterprise booking tables missing — run: npx prisma db push"
          : "Could not load enterprise bookings",
        details: message,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const notifyEmail =
    typeof body.notifyEmail === "string" ? body.notifyEmail.trim() : undefined;
  const enabled =
    typeof body.enabled === "boolean" ? body.enabled : undefined;

  if (notifyEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
    return NextResponse.json({ error: "Invalid notify email" }, { status: 400 });
  }

  const row = await prisma.enterpriseBookingConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      notifyEmail: notifyEmail ?? "hello@contractorleads.us",
      enabled: enabled ?? true,
    },
    update: {
      ...(notifyEmail !== undefined ? { notifyEmail } : {}),
      ...(enabled !== undefined ? { enabled } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    config: {
      notifyEmail: row.notifyEmail,
      enabled: row.enabled,
    },
  });
}
