import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const MARKETING_VISITOR_COOKIE = "cl_mkt_vid";
const VISITOR_KEY_BYTES = 24;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function getMarketingVisitorKeyFromCookie(): Promise<string | null> {
  const store = await cookies();
  const key = store.get(MARKETING_VISITOR_COOKIE)?.value?.trim();
  if (!key || key.length < 16) return null;
  return key;
}

export async function setMarketingVisitorCookie(visitorKey: string) {
  const store = await cookies();
  store.set(MARKETING_VISITOR_COOKIE, visitorKey, cookieOptions());
}

export async function ensureMarketingVisitorKey(): Promise<string> {
  const existing = await getMarketingVisitorKeyFromCookie();
  if (existing) return existing;
  const visitorKey = randomBytes(VISITOR_KEY_BYTES).toString("hex");
  await setMarketingVisitorCookie(visitorKey);
  return visitorKey;
}

export type MarketingTouchInput = {
  landingPath?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
};

export async function touchMarketingVisitor(
  visitorKey: string,
  input: MarketingTouchInput = {},
) {
  const now = new Date();
  const data = {
    lastSeenAt: now,
    landingPath: input.landingPath?.slice(0, 500) ?? undefined,
    utmSource: input.utmSource?.slice(0, 120) ?? undefined,
    utmMedium: input.utmMedium?.slice(0, 120) ?? undefined,
    utmCampaign: input.utmCampaign?.slice(0, 120) ?? undefined,
    referrer: input.referrer?.slice(0, 500) ?? undefined,
    userAgent: input.userAgent?.slice(0, 500) ?? undefined,
  };

  const existing = await prisma.marketingVisitor.findUnique({
    where: { visitorKey },
  });

  if (!existing) {
    await prisma.marketingVisitor.create({
      data: {
        visitorKey,
        visitCount: 1,
        firstSeenAt: now,
        ...data,
      },
    });
    return;
  }

  await prisma.marketingVisitor.update({
    where: { visitorKey },
    data: {
      visitCount: { increment: 1 },
      ...data,
    },
  });
}

export async function captureMarketingEmail(input: {
  email: string;
  emailOptIn: boolean;
  source: string;
  touch?: MarketingTouchInput;
}) {
  const normalized = input.email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("INVALID_EMAIL");
  }

  const visitorKey = await ensureMarketingVisitorKey();
  if (input.touch) {
    await touchMarketingVisitor(visitorKey, input.touch);
  }

  const now = new Date();
  await prisma.marketingVisitor.upsert({
    where: { visitorKey },
    create: {
      visitorKey,
      email: normalized,
      emailOptIn: input.emailOptIn,
      source: input.source.slice(0, 80),
      visitCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      ...(input.touch?.landingPath
        ? { landingPath: input.touch.landingPath.slice(0, 500) }
        : {}),
    },
    update: {
      email: normalized,
      emailOptIn: input.emailOptIn,
      source: input.source.slice(0, 80),
      lastSeenAt: now,
    },
  });

  return { visitorKey, email: normalized };
}

export async function linkMarketingVisitorToUser(userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  const now = new Date();
  const visitorKey = await getMarketingVisitorKeyFromCookie();

  if (visitorKey) {
    await prisma.marketingVisitor.updateMany({
      where: { visitorKey },
      data: {
        convertedUserId: userId,
        convertedAt: now,
        email: normalized,
      },
    });
  }

  await prisma.marketingVisitor.updateMany({
    where: {
      email: normalized,
      convertedUserId: null,
    },
    data: {
      convertedUserId: userId,
      convertedAt: now,
    },
  });
}
