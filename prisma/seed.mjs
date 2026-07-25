import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_DEMO = process.env.SEED_DEMO === "true";

/**
 * Creates the first super admin from env vars. Only ever creates — never
 * rewrites the password of an account that already exists, so a deploy can't
 * reset live admin credentials.
 */
async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { role: "SUPER_ADMIN" },
      });
      console.log(`Promoted existing user to SUPER_ADMIN: ${email}`);
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
      role: "SUPER_ADMIN",
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
  console.log(`Created super admin: ${email}`);
}

async function seedDemoAccounts() {
  const demoHash = await bcrypt.hash("demo12345", 12);
  const adminHash = await bcrypt.hash("admin12345", 12);

  await prisma.user.upsert({
    where: { email: "demo@leadflow.us" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: demoHash,
    },
    create: {
      email: "demo@leadflow.us",
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

  await prisma.user.upsert({
    where: { email: "admin@leadflow.us" },
    update: {
      role: "SUPER_ADMIN",
      passwordHash: adminHash,
      emailVerifiedAt: new Date(),
      creditsRemaining: 9999,
      onboardingComplete: true,
    },
    create: {
      email: "admin@leadflow.us",
      name: "Super Admin",
      passwordHash: adminHash,
      emailVerifiedAt: new Date(),
      role: "SUPER_ADMIN",
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

  console.log("Seed complete:");
  if (SEED_DEMO) {
    console.log("  demo@leadflow.us / demo12345");
    console.log("  admin@leadflow.us / admin12345 (SUPER_ADMIN)");
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
