import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Search saved leads that have a phone number (for the SMS composer). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() || "";

  const saved = await prisma.savedLead.findMany({
    where: {
      userId: user.id,
      lead: {
        AND: [{ phone: { not: null } }, { phone: { not: "" } }],
        ...(q
          ? {
              OR: [
                { businessName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
    include: {
      lead: {
        select: {
          id: true,
          businessName: true,
          phone: true,
          city: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    leads: saved
      .filter((s) => s.lead.phone)
      .map((s) => ({
        id: s.lead.id,
        businessName: s.lead.businessName,
        phone: s.lead.phone,
        city: s.lead.city,
        status: s.status,
      })),
  });
}
