import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  normalizeAccentColor,
  normalizeLogoDataUrl,
  normalizeOptionalUrl,
} from "@/lib/agency-branding";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
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
      phone: true,
      businessDescription: true,
      services: true,
      idealCustomer: true,
      serviceAreas: true,
      mainGoal: true,
    },
  });

  return NextResponse.json({
    profile: row,
    hasCompanyLogo: Boolean(row?.companyLogoData?.trim()),
  });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  let companyLogoData: string | null | undefined;
  try {
    if ("companyLogoData" in body) {
      companyLogoData = normalizeLogoDataUrl(body.companyLogoData);
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid logo" },
      { status: 400 },
    );
  }

  const companyWebsite =
    "companyWebsite" in body
      ? normalizeOptionalUrl(body.companyWebsite) ?? null
      : undefined;
  const reportAccentColor =
    "reportAccentColor" in body
      ? normalizeAccentColor(body.reportAccentColor)
      : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() || null : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : undefined,
      companyName:
        typeof body.companyName === "string"
          ? body.companyName.trim() || null
          : undefined,
      companyWebsite,
      companyTagline:
        typeof body.companyTagline === "string"
          ? body.companyTagline.trim() || null
          : undefined,
      companyAddress:
        typeof body.companyAddress === "string"
          ? body.companyAddress.trim() || null
          : undefined,
      reportAccentColor,
      ...(companyLogoData !== undefined ? { companyLogoData } : {}),
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
