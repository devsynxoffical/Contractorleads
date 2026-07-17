import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = await prisma.search.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      leads: {
        orderBy: { leadScore: "desc" },
      },
    },
  });

  if (!search) {
    return NextResponse.json({ search: null, leads: [] });
  }

  return NextResponse.json({
    search: {
      id: search.id,
      industry: search.industry,
      country: search.country,
      locationScope: search.locationScope,
      state: search.state,
      city: search.city,
      zip: search.zip,
      radius: search.radius,
      resultCount: search.resultCount,
      createdAt: search.createdAt,
    },
    leads: search.leads,
  });
}
