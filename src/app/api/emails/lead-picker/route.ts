import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Search the user's saved leads that have an email address (for compose / bulk). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const rawLimit = Number(url.searchParams.get("limit") || "25");
  const take = Math.min(
    200,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 25),
  );

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
    take,
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
