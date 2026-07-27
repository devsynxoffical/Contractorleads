import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEnterpriseBookingEmails } from "@/lib/email";
import {
  formatSlotLabel,
  getEnterpriseNotifyEmail,
  isEnterpriseBookingEnabled,
  slotAlreadyBooked,
  validateBookingInput,
  type EnterpriseBookingInput,
} from "@/lib/enterprise-booking";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request) ?? "unknown";
  const rl = rateLimit(`enterprise-book:${ip}`, {
    limit: 8,
    windowMs: 60 * 60_000,
  });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  if (!(await isEnterpriseBookingEnabled())) {
    return NextResponse.json(
      { error: "Enterprise booking is temporarily unavailable." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as EnterpriseBookingInput;
  const err = validateBookingInput(body);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const scheduledAt = new Date(body.scheduledAt);
  if (await slotAlreadyBooked(scheduledAt)) {
    return NextResponse.json(
      { error: "That time was just booked. Please pick another slot." },
      { status: 409 },
    );
  }

  const whenLabel = formatSlotLabel(scheduledAt);

  let booking;
  try {
    booking = await prisma.enterpriseBooking.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        company: body.company?.trim() || null,
        phone: body.phone?.trim() || null,
        message: body.message?.trim() || null,
        scheduledAt,
        timezone: body.timezone?.trim() || "America/New_York",
        source: body.source?.trim() || "pricing",
        utmSource: body.utmSource?.trim() || null,
        utmMedium: body.utmMedium?.trim() || null,
        utmCampaign: body.utmCampaign?.trim() || null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/EnterpriseBooking|does not exist|P2021/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Booking system is not ready yet. Please email hello@contractorleads.us.",
        },
        { status: 503 },
      );
    }
    throw e;
  }

  const notifyTo = await getEnterpriseNotifyEmail();
  const mail = await sendEnterpriseBookingEmails({
    to: booking.email,
    notifyTo,
    name: booking.name,
    company: booking.company,
    phone: booking.phone,
    message: booking.message,
    whenLabel,
    source: booking.source,
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: booking.id,
      scheduledAt: booking.scheduledAt.toISOString(),
      whenLabel,
    },
    emailSent: mail.clientOk,
    teamNotified: mail.teamOk,
    emailWarning:
      !mail.clientOk || !mail.teamOk
        ? "Booking saved, but email delivery had an issue. Our team will still follow up."
        : undefined,
  });
}
