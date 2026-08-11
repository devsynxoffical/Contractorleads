import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_DEMO = process.env.SEED_DEMO === "true";

/** The platform owner account gets the OWNER role (above SUPER_ADMIN). */
const OWNER_EMAIL = "hello@contractorleads.us";

/**
 * Creates the first super admin from env vars. Only ever creates — never
 * rewrites the password of an account that already exists, so a deploy can't
 * reset live admin credentials.
 */
async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const targetRole = email === OWNER_EMAIL ? "OWNER" : "SUPER_ADMIN";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== targetRole) {
      await prisma.user.update({
        where: { email },
        data: { role: targetRole },
      });
      console.log(`Promoted existing user to ${targetRole}: ${email}`);
    }
    return;
  }

  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters. Skipping admin bootstrap.");
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || "Super Admin",
      passwordHash: await bcrypt.hash(password, 12),
      emailVerifiedAt: new Date(),
      role: targetRole,
      plan: "agency",
      subscriptionStatus: "active",
      creditsRemaining: 9999,
      onboardingComplete: true,
      companyName: "Contractor Leads Ops",
      businessDescription: "Platform super administrator",
      services: "Platform operations",
      idealCustomer: "Internal",
      serviceAreas: "Global",
      mainGoal: "Operate the lead platform",
    },
  });
  console.log(`Created ${targetRole === "OWNER" ? "owner" : "super admin"}: ${email}`);
}

async function seedDemoAccounts() {
  const demoHash = await bcrypt.hash("demo12345", 12);
  const adminHash = await bcrypt.hash("admin12345", 12);

  await prisma.user.upsert({
    where: { email: "demo@contractorleads.us" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: demoHash,
    },
    create: {
      email: "demo@contractorleads.us",
      name: "Vaishali",
      passwordHash: demoHash,
      emailVerifiedAt: new Date(),
      role: "USER",
      plan: "trial",
      subscriptionStatus: "trialing",
      creditsRemaining: 20,
      onboardingComplete: true,
      companyName: "Million Dollar Media",
      businessDescription:
        "Digital marketing agency helping home-service contractors scale with paid media.",
      services: "Facebook ads, Google ads, funnels, creative, lead gen",
      idealCustomer: "Roofing and HVAC owners doing $500K–$3M/year",
      serviceAreas: "United States — Texas, Florida, Arizona",
      mainGoal: "Book 8 new agency clients per month",
    },
  });

  const legacyOwner = await prisma.user.findUnique({
    where: { email: "admin@contractorleads.us" },
  });
  const helloOwner = await prisma.user.findUnique({
    where: { email: "hello@contractorleads.us" },
  });

  if (legacyOwner && !helloOwner) {
    await prisma.user.update({
      where: { email: "admin@contractorleads.us" },
      data: {
        email: "hello@contractorleads.us",
        role: "OWNER",
        passwordHash: adminHash,
        emailVerifiedAt: new Date(),
        creditsRemaining: 9999,
        onboardingComplete: true,
      },
    });
  } else {
    await prisma.user.upsert({
      where: { email: "hello@contractorleads.us" },
      update: {
        role: "OWNER",
        passwordHash: adminHash,
        emailVerifiedAt: new Date(),
        creditsRemaining: 9999,
        onboardingComplete: true,
      },
      create: {
        email: "hello@contractorleads.us",
        name: "Owner",
        passwordHash: adminHash,
        emailVerifiedAt: new Date(),
        role: "OWNER",
        plan: "agency",
        subscriptionStatus: "active",
        creditsRemaining: 9999,
        onboardingComplete: true,
        companyName: "Contractor Leads Ops",
        businessDescription: "Platform super administrator",
        services: "Platform operations",
        idealCustomer: "Internal",
        serviceAreas: "Global",
        mainGoal: "Operate the lead platform",
      },
    });
  }
}

async function main() {
  if (SEED_DEMO) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Refusing to seed demo accounts with published passwords while NODE_ENV=production. Unset SEED_DEMO.",
      );
    }
    await seedDemoAccounts();
  }

  await bootstrapAdmin();

  const managerPerms = [
    "overview",
    "customers",
    "leads",
    "leads_export",
    "saved_leads",
    "searches",
    "scrape",
    "copy_leads",
    "revenue",
    "referrals",
    "activity",
    "health",
  ];
  const subAdminPerms = [
    "overview",
    "leads",
    "leads_export",
    "saved_leads",
    "searches",
    "scrape",
    "activity",
  ];

  await prisma.adminRoleTemplate.upsert({
    where: { role: "MANAGER" },
    update: {
      permissions: JSON.stringify(managerPerms),
    },
    create: {
      role: "MANAGER",
      label: "Manager",
      permissions: JSON.stringify(managerPerms),
    },
  });

  await prisma.adminRoleTemplate.upsert({
    where: { role: "SUB_ADMIN" },
    update: {},
    create: {
      role: "SUB_ADMIN",
      label: "Sub Admin",
      permissions: JSON.stringify(subAdminPerms),
    },
  });

  await prisma.referralRewardConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: true,
      creditsPerReferral: 10,
      milestonesJson: JSON.stringify([
        { minReferrals: 10, bonusCredits: 50 },
        { minReferrals: 50, bonusCredits: 200 },
        { minReferrals: 100, bonusCredits: 500 },
      ]),
    },
  });

  await prisma.aiBrainConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: true,
      globalInstructions: "",
      knowledgeBase: "",
      model: "gpt-4o-mini",
      outreachModel: "gpt-4o-mini",
    },
  });

  console.log("Seed complete:");
  if (SEED_DEMO) {
    console.log("  demo@contractorleads.us / demo12345");
    console.log("  hello@contractorleads.us / admin12345 (OWNER)");
  } else {
    console.log("  Demo accounts skipped (set SEED_DEMO=true for local dev)");
  }
  console.log("  Role templates: MANAGER, SUB_ADMIN");
  console.log("  Referral rewards config seeded");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
