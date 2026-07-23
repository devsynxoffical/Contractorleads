import { NextResponse } from "next/server";
import {
  hashPassword,
  isAdminStaff,
  isSuperAdmin,
  requirePermission,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/admin";
import { integrationFlagsForPlan } from "@/lib/api-access";
import { applyReferralCommissionOnPurchase } from "@/lib/referrals";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
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
      phone: true,
      role: true,
      plan: true,
      subscriptionStatus: true,
      creditsRemaining: true,
      onboardingComplete: true,
      companyName: true,
      ownerName: true,
      ownerEmail: true,
      ownerPhone: true,
      businessDescription: true,
      services: true,
      idealCustomer: true,
      serviceAreas: true,
      mainGoal: true,
      ssoEnabled: true,
      apiEnabled: true,
      mcpEnabled: true,
      apiMonthlyLimit: true,
      apiMonthlyUsed: true,
      apiUsageResetAt: true,
      apiKeyLast4: true,
      crmWebhookUrl: true,
      crmWebhookSecret: true,
      crmWebhookEnabled: true,
      slackWebhookUrl: true,
      slackEnabled: true,
      ghlWebhookUrl: true,
      ghlEnabled: true,
      emailMarketingOptIn: true,
      createdAt: true,
      updatedAt: true,
      isActive: true,
      adminNotes: true,
      referralCode: true,
      referredByUserId: true,
      referredBy: {
        select: {
          id: true,
          email: true,
          companyName: true,
          name: true,
          referralCode: true,
        },
      },
      teamMembers: {
        where: { status: { not: "revoked" } },
        orderBy: { invitedAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          invitedAt: true,
        },
      },
      smtpAccounts: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          label: true,
          host: true,
          fromEmail: true,
          enabled: true,
          isDefault: true,
          updatedAt: true,
        },
      },
      emailSequence: {
        select: {
          id: true,
          name: true,
          enabled: true,
          updatedAt: true,
          _count: { select: { enrollments: true } },
        },
      },
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
        select: {
          searches: true,
          savedLeads: true,
          activities: true,
          scripts: true,
          leadEmails: true,
          exports: true,
          teamMembers: true,
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
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
    "phone",
    "companyName",
    "ownerName",
    "ownerEmail",
    "ownerPhone",
    "businessDescription",
    "services",
    "idealCustomer",
    "serviceAreas",
    "mainGoal",
    "ssoEnabled",
    "apiEnabled",
    "mcpEnabled",
    "crmWebhookUrl",
    "crmWebhookSecret",
    "crmWebhookEnabled",
    "slackWebhookUrl",
    "slackEnabled",
    "ghlWebhookUrl",
    "ghlEnabled",
    "emailMarketingOptIn",
  ] as const) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (body.apiMonthlyLimit !== undefined) {
    const parsed = Number(body.apiMonthlyLimit);
    if (Number.isFinite(parsed) && parsed >= 0) {
      data.apiMonthlyLimit = Math.floor(parsed);
    }
  }

  if (typeof body.email === "string" && body.email.trim()) {
    data.email = body.email.trim().toLowerCase();
  }
  if (typeof body.plan === "string" && planValues.includes(body.plan as never)) {
    data.plan = body.plan;
    // When plan changes, sync integration flags unless admin also patched them explicitly
    const flags = integrationFlagsForPlan(body.plan);
    if (body.apiEnabled === undefined) data.apiEnabled = flags.apiEnabled;
    if (body.mcpEnabled === undefined) data.mcpEnabled = flags.mcpEnabled;
    if (body.ssoEnabled === undefined) data.ssoEnabled = flags.ssoEnabled;
    if (body.apiMonthlyLimit === undefined) {
      data.apiMonthlyLimit = flags.apiMonthlyLimit;
    }
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
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }
  if (typeof body.adminNotes === "string") {
    data.adminNotes = body.adminNotes;
  }
  if (body.role === "USER" || body.role === "SUPER_ADMIN") {
    data.role = body.role;
  }
  if (typeof body.password === "string" && body.password.length >= 8) {
    data.passwordHash = await hashPassword(body.password);
  }

  if (body.referredByCode !== undefined || body.referredByUserId !== undefined) {
    let referrerId: string | null = null;
    if (
      typeof body.referredByUserId === "string" &&
      body.referredByUserId.trim()
    ) {
      referrerId = body.referredByUserId.trim();
    } else if (
      typeof body.referredByCode === "string" &&
      body.referredByCode.trim()
    ) {
      const code = body.referredByCode.trim().toUpperCase();
      const referrer = await prisma.user.findFirst({
        where: {
          referralCode: { equals: code, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (!referrer) {
        return NextResponse.json(
          { error: "Referral code not found" },
          { status: 400 },
        );
      }
      referrerId = referrer.id;
    } else if (
      body.referredByCode === null ||
      body.referredByCode === "" ||
      body.referredByUserId === null ||
      body.referredByUserId === ""
    ) {
      referrerId = null;
    }

    if (referrerId === id) {
      return NextResponse.json(
        { error: "A user cannot refer themselves" },
        { status: 400 },
      );
    }
    if (referrerId) {
      const referrerExists = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { id: true },
      });
      if (!referrerExists) {
        return NextResponse.json(
          { error: "Referrer user not found" },
          { status: 400 },
        );
      }
    }
    data.referredByUserId = referrerId;
  }

  try {
    const previousPlan = existing.plan;
    const previousStatus = existing.subscriptionStatus;

    const customer = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        creditsRemaining: true,
        onboardingComplete: true,
        companyName: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        businessDescription: true,
        services: true,
        idealCustomer: true,
        serviceAreas: true,
        mainGoal: true,
        ssoEnabled: true,
        apiEnabled: true,
        mcpEnabled: true,
        apiMonthlyLimit: true,
        apiMonthlyUsed: true,
        apiUsageResetAt: true,
        apiKeyLast4: true,
        crmWebhookUrl: true,
        crmWebhookSecret: true,
        crmWebhookEnabled: true,
        slackWebhookUrl: true,
        slackEnabled: true,
        ghlWebhookUrl: true,
        ghlEnabled: true,
        emailMarketingOptIn: true,
        isActive: true,
        adminNotes: true,
        referralCode: true,
        referredByUserId: true,
        referredBy: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
            referralCode: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    const planChanged =
      typeof data.plan === "string" && data.plan !== previousPlan;
    const statusChanged =
      typeof data.subscriptionStatus === "string" &&
      data.subscriptionStatus !== previousStatus;

    if (planChanged || statusChanged) {
      try {
        await applyReferralCommissionOnPurchase({
          userId: customer.id,
          plan: customer.plan,
          previousPlan,
          subscriptionStatus: customer.subscriptionStatus,
        });
      } catch (err) {
        console.error("[referral] commission on purchase failed", err);
      }
    }

    return NextResponse.json({ customer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (isAdminStaff(existing)) {
    return NextResponse.json(
      { error: "Cannot delete admin staff from the customers panel — use Team & Roles" },
      { status: 400 },
    );
  }
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
