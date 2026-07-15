import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 12);

  await prisma.user.upsert({
    where: { email: "demo@leadflow.us" },
    update: {},
    create: {
      email: "demo@leadflow.us",
      name: "Vaishali",
      passwordHash,
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

  console.log("Seed complete: demo@leadflow.us / demo12345");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
