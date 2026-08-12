import { prisma } from "@/lib/prisma";
import type { Lead } from "@prisma/client";

/**
 * Business identity helpers used to keep the lead pool free of duplicates.
 *
 * The same Google Maps business is reachable through different maps-link
 * representations (Places API `cid=` URIs vs scraper `/maps/place/` URLs), so
 * exact-mapsLink matching alone misses duplicates. Phone digits are the most
 * reliable cross-source identity.
 */

export function normBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(
      /\b(inc|llc|ltd|limited|co|company|corp|corporation|group|llp|plc|enterprise|enterprises|services?)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function normAddressKey(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(
      /\b(street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|court|ct|suite|ste|highway|hwy|unit|apt|apartment|floor|fl|north|north|south|east|west)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Last 10 digits so "+1 954-989-7794" and "(954) 989-7794" match. */
export function phoneMatchKey(phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function websiteDomain(url?: string | null): string {
  if (!url) return "";
  const cleaned = url.trim();
  try {
    return new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`)
      .hostname.replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return cleaned
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0];
  }
}

/**
 * Find an existing pool lead that represents the same business.
 * Strongest identity first: Google Maps link → phone → exact name + address.
 *
 * Website domain is deliberately NOT used on its own — chains/franchises share
 * one domain across distinct branches and must not be collapsed.
 */
export async function findExistingLead(input: {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
}): Promise<Lead | null> {
  if (input.mapsUrl) {
    const byMap = await prisma.lead.findFirst({
      where: { googleMapsLink: input.mapsUrl },
    });
    if (byMap) return byMap;
  }

  const pkey = phoneMatchKey(input.phone);
  if (pkey.length >= 7) {
    const tail4 = pkey.slice(-4);
    const candidates = await prisma.lead.findMany({
      where: { phone: { not: null, endsWith: tail4 } },
      take: 100,
    });
    const hit = candidates.find((c) => phoneMatchKey(c.phone) === pkey);
    if (hit) return hit;
  }

  if (input.name) {
    const nameHit = await prisma.lead.findFirst({
      where: {
        businessName: { equals: input.name, mode: "insensitive" },
        ...(input.address
          ? { address: { equals: input.address, mode: "insensitive" } }
          : {}),
      },
    });
    if (nameHit) return nameHit;
  }

  return null;
}
