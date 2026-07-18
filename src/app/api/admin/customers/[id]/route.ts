import { NextResponse } from "next/server";
import { hashPassword, isSuperAdmin, requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      subscriptionStatus: true,
      creditsRemaining: true,
      onboardingComplete: true,
      companyName: true,
      businessDescription: true,
      services: true,
      idealCustomer: true,
      serviceAreas: true,
      mainGoal: true,
      createdAt: true,
      updatedAt: true,
      searches: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          industry: true,
          country: true,
          locationScope: true,
          state: true,
          city: true,
          resultCount: true,
          createdAt: true,
        },
      },
      creditLedger: {
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { searches: true, savedLeads: true, activities: true },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    isSuperAdmin(existing) &&
    body.role &&
    body.role !== "SUPER_ADMIN"
  ) {
    const adminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last super admin" },
        { status: 400 },
      );
    }
  }

  const planValues = ADMIN_PLANS.map((p) => p.value);
  const data: Record<string, unknown> = {};

  for (const key of [
    "name",
    "companyName",
    "businessDescription",
    "services",
    "idealCustomer",
    "serviceAreas",
    "mainGoal",
  ] as const) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (typeof body.email === "string" && body.email.trim()) {
    data.email = body.email.trim().toLowerCase();
  }
  if (typeof body.plan === "string" && planValues.includes(body.plan as never)) {
    data.plan = body.plan;
  }
  if (
    typeof body.subscriptionStatus === "string" &&
    (SUBSCRIPTION_STATUSES as readonly string[]).includes(body.subscriptionStatus)
  ) {
    data.subscriptionStatus = body.subscriptionStatus;
  }
  if (typeof body.onboardingComplete === "boolean") {
    data.onboardingComplete = body.onboardingComplete;
  }
  if (body.role === "USER" || body.role === "SUPER_ADMIN") {
    data.role = body.role;
  }
  if (typeof body.password === "string" && body.password.length >= 8) {
    data.passwordHash = await hashPassword(body.password);
  }

  try {
    const customer = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        creditsRemaining: true,
        onboardingComplete: true,
        companyName: true,
        businessDescription: true,
        services: true,
        idealCustomer: true,
        serviceAreas: true,
        mainGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ customer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
