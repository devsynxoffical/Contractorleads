import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES, hashPassword, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS } from "@/lib/admin";
import { logActivity } from "@/lib/credits";

export async function GET(request: Request) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const plan = searchParams.get("plan")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get("pageSize") ?? 20)));

  const where = {
    role: { notIn: [...ADMIN_STAFF_ROLES] },
    ...(plan ? { plan } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { companyName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        plan: true,
        subscriptionStatus: true,
        creditsRemaining: true,
        onboardingComplete: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: { searches: true, savedLeads: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    customers,
    total,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  const name = typeof body.name === "string" ? body.name.trim() : null;
  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : null;
  const ownerName =
    typeof body.ownerName === "string" ? body.ownerName.trim() : null;
  const ownerEmail =
    typeof body.ownerEmail === "string"
      ? body.ownerEmail.trim().toLowerCase()
      : null;
  const ownerPhone =
    typeof body.ownerPhone === "string" ? body.ownerPhone.trim() : null;
  const planValues = ADMIN_PLANS.map((p) => p.value);
  const plan =
    typeof body.plan === "string" && planValues.includes(body.plan as never)
      ? body.plan
      : "trial";
  const creditsRemaining =
    typeof body.creditsRemaining === "number" && body.creditsRemaining >= 0
      ? body.creditsRemaining
      : 20;

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and password (min 8 chars) are required" },
      { status: 400 },
    );
  }

  try {
    const customer = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        name,
        companyName,
        ownerName,
        ownerEmail,
        ownerPhone,
        plan,
        subscriptionStatus: plan === "trial" ? "trialing" : "active",
        creditsRemaining,
        onboardingComplete: Boolean(body.onboardingComplete),
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        plan: true,
        creditsRemaining: true,
      },
    });

    await logActivity(admin.id, "admin_create_customer", `Created agency ${email}`, {
      customerId: customer.id,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
