import { prisma } from "@/lib/prisma";

export type AgencyReportBranding = {
  companyName: string | null;
  companyWebsite: string | null;
  companyTagline: string | null;
  companyAddress: string | null;
  reportAccentColor: string | null;
  companyLogoData: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  name: string | null;
  email: string;
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeAccentColor(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (!HEX_COLOR.test(withHash)) return null;
  if (withHash.length === 4) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return withHash.toUpperCase();
}

/** Accepts a browser data URL; rejects huge / non-image payloads. */
export function normalizeLogoDataUrl(input: unknown): string | null | undefined {
  if (input === null) return null;
  if (typeof input !== "string") return undefined;
  const raw = input.trim();
  if (!raw) return null;
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(raw)) {
    throw new Error("Logo must be a PNG, JPEG, or WebP image");
  }
  // ~350KB raw base64 ≈ safe for DB + PDF embed
  if (raw.length > 480_000) {
    throw new Error("Logo is too large — use an image under ~350KB");
  }
  return raw;
}

export function normalizeOptionalUrl(input: unknown): string | null | undefined {
  if (input === null) return null;
  if (typeof input !== "string") return undefined;
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function getAgencyReportBranding(
  userId: string,
): Promise<AgencyReportBranding | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      companyName: true,
      companyWebsite: true,
      companyTagline: true,
      companyAddress: true,
      reportAccentColor: true,
      companyLogoData: true,
      ownerName: true,
      ownerEmail: true,
      ownerPhone: true,
      name: true,
      email: true,
    },
  });
}

export function agencyDisplayName(brand: AgencyReportBranding | null | undefined) {
  return brand?.companyName?.trim() || brand?.name?.trim() || "Your agency";
}
