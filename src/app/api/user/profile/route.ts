import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() || null : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : undefined,
      companyName: body.companyName,
      ownerName:
        typeof body.ownerName === "string" ? body.ownerName.trim() || null : undefined,
      ownerEmail:
        typeof body.ownerEmail === "string"
          ? body.ownerEmail.trim().toLowerCase() || null
          : undefined,
      ownerPhone:
        typeof body.ownerPhone === "string" ? body.ownerPhone.trim() || null : undefined,
      businessDescription: body.businessDescription,
      services: body.services,
      idealCustomer: body.idealCustomer,
      serviceAreas: body.serviceAreas,
      mainGoal: body.mainGoal,
      onboardingComplete: body.onboardingComplete ?? true,
      darkMode: body.darkMode,
    },
  });

  return NextResponse.json({ ok: true });
}
