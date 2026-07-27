import { prisma } from "@/lib/prisma";
import { EMAIL_BRAND } from "@/lib/email-brand";

export const ENTERPRISE_BOOKING_TZ = "America/New_York";

/** Weekday slots 9:00 AM – 5:00 PM Eastern, every 30 minutes (last slot 4:30 PM). */
export const ENTERPRISE_SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16] as const;
export const ENTERPRISE_SLOT_MINUTES = [0, 30] as const;

export type EnterpriseBookingInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
  scheduledAt: string;
  timezone?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type BookableSlot = {
  iso: string;
  label: string;
  dateKey: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD in America/New_York for a given instant. */
export function dateKeyInTz(iso: string | Date, tz = ENTERPRISE_BOOKING_TZ) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Build UTC Date for a calendar day + hour/minute in Eastern. */
export function slotToUtc(
  dateKey: string,
  hour: number,
  minute: number,
  tz = ENTERPRISE_BOOKING_TZ,
): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  let utc = Date.UTC(y, m - 1, d, hour + 4, minute);
  for (let i = 0; i < 8; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date(utc));
    const h =
      Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
    const min = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    if (h === hour && min === minute) break;
    utc += ((hour - h) * 60 + (minute - min)) * 60_000;
  }
  return new Date(utc);
}

export function formatSlotLabel(iso: string | Date, tz = ENTERPRISE_BOOKING_TZ) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

export function formatTimeOnly(iso: string | Date, tz = ENTERPRISE_BOOKING_TZ) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function isWeekdayInTz(dateKey: string, tz = ENTERPRISE_BOOKING_TZ) {
  const noon = slotToUtc(dateKey, 12, 0, tz);
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(noon);
  return wd !== "Sat" && wd !== "Sun";
}

/** Bookable dates: next 45 weekdays (Mon–Fri). */
export function bookableDateKeys(
  from = new Date(),
  count = 45,
  tz = ENTERPRISE_BOOKING_TZ,
): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);
  let guard = 0;
  while (keys.length < count && guard < 120) {
    const key = dateKeyInTz(cursor, tz);
    if (isWeekdayInTz(key, tz) && !keys.includes(key)) {
      keys.push(key);
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return keys;
}

export function slotsForDate(
  dateKey: string,
  now = new Date(),
  tz = ENTERPRISE_BOOKING_TZ,
): BookableSlot[] {
  if (!isWeekdayInTz(dateKey, tz)) return [];

  const todayKey = dateKeyInTz(now, tz);
  const slots: BookableSlot[] = [];

  for (const hour of ENTERPRISE_SLOT_HOURS) {
    for (const minute of ENTERPRISE_SLOT_MINUTES) {
      if (hour === 16 && minute === 30) continue;
      const utc = slotToUtc(dateKey, hour, minute, tz);
      if (utc.getTime() <= now.getTime() + 60 * 60_000) continue;
      slots.push({
        iso: utc.toISOString(),
        dateKey,
        label: formatTimeOnly(utc, tz),
      });
    }
  }

  if (dateKey < todayKey) return [];
  return slots;
}

export function validateBookingInput(input: EnterpriseBookingInput) {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name || name.length < 2) return "Please enter your name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid work email.";
  }
  const scheduled = new Date(input.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) return "Please pick a date and time.";
  if (scheduled.getTime() <= Date.now() + 30 * 60_000) {
    return "Please pick a time at least 30 minutes from now.";
  }
  const key = dateKeyInTz(scheduled);
  const allowed = slotsForDate(key).some(
    (s) => Math.abs(new Date(s.iso).getTime() - scheduled.getTime()) < 60_000,
  );
  if (!allowed) return "That time slot is not available. Please choose another.";
  return null;
}

export async function getEnterpriseNotifyEmail() {
  const row = await prisma.enterpriseBookingConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  const email = row?.notifyEmail?.trim() || EMAIL_BRAND.contactEmail;
  return email;
}

export async function isEnterpriseBookingEnabled() {
  const row = await prisma.enterpriseBookingConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  return row?.enabled !== false;
}

export async function slotAlreadyBooked(scheduledAt: Date) {
  const existing = await prisma.enterpriseBooking.findFirst({
    where: {
      scheduledAt: scheduledAt,
      status: { notIn: ["cancelled"] },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function getBookedSlotIsos(from: Date, to: Date) {
  const rows = await prisma.enterpriseBooking.findMany({
    where: {
      scheduledAt: { gte: from, lte: to },
      status: { notIn: ["cancelled"] },
    },
    select: { scheduledAt: true },
  });
  return new Set(rows.map((r) => r.scheduledAt.toISOString()));
}
