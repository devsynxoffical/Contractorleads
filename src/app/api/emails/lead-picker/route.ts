import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Search the user's saved leads that have an email address (for the composer). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() || "";

  const saved = await prisma.savedLead.findMany({
    where: {
      userId: user.id,
      lead: {
        AND: [{ email: { not: null } }, { email: { not: "" } }],
        ...(q
          ? {
              OR: [
                { businessName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
    include: {
      lead: {
        select: { id: true, businessName: true, email: true, city: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    leads: saved
      .filter((s) => s.lead.email)
      .map((s) => ({
        id: s.lead.id,
        businessName: s.lead.businessName,
        email: s.lead.email,
        city: s.lead.city,
        status: s.status,
      })),
  });
}
