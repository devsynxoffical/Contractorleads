import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const fallback = await prisma.lead.findMany({
    where: { googleMapsLink: { startsWith: "https://www.google.com/maps/search/" } },
    select: { id: true, googleMapsLink: true },
  });
  console.log("name-based fallback maps links:", fallback.length);

  const byLink = new Map<string, string[]>();
  for (const l of fallback) {
    const arr = byLink.get(l.googleMapsLink!) ?? [];
    arr.push(l.id);
    byLink.set(l.googleMapsLink!, arr);
  }
  let dup = 0;
  for (const [, ids] of byLink) if (ids.length > 1) dup++;
  console.log("fallback groups with >1 lead:", dup);

  // distinct raw phone dups (exact)
  const exactPhone = await prisma.lead.groupBy({
    by: ["phone"],
    where: { phone: { not: null } },
    _count: { _all: true },
    having: { phone: { _count: { gt: 1 } } },
  });
  console.log("exact raw-phone dup groups:", exactPhone.length);

  // how many leads total have a phone or maps link
  const phoneCount = await prisma.lead.count({ where: { phone: { not: null } } });
  const mapCount = await prisma.lead.count({ where: { googleMapsLink: { not: null } } });
  console.log("leads with phone:", phoneCount, "with mapsLink:", mapCount);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
