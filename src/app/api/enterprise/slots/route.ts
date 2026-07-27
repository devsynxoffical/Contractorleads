import { NextResponse } from "next/server";
import {
  bookableDateKeys,
  getBookedSlotIsos,
  slotsForDate,
} from "@/lib/enterprise-booking";

/** Public: bookable dates + time slots (excludes already booked). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date")?.trim();

  if (dateKey) {
    const slots = slotsForDate(dateKey);
    const from = slots[0] ? new Date(slots[0].iso) : new Date();
    const to = slots.length
      ? new Date(slots[slots.length - 1].iso)
      : new Date(from.getTime() + 86400000);
    const booked = await getBookedSlotIsos(from, to).catch(() => new Set<string>());

    return NextResponse.json({
      dateKey,
      slots: slots.filter((s) => !booked.has(s.iso)),
    });
  }

  const dates = bookableDateKeys();
  return NextResponse.json({ dates, timezone: "America/New_York" });
}
