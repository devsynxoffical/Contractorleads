/**
 * One-off cleanup: merge duplicate leads already in the pool.
 *
 * Merge groups are built from the same normalized phone (strongest cross-source
 * signal) and the same Google Maps link. Website-domain matches are NOT merged
 * on their own — chains/franchises share a domain across distinct branches.
 *
 * Within each group the "best" row is kept (highest leadScore, then most
 * complete, then newest). Its child relations (SavedLead / LeadUnlock /
 * LeadEmail / LeadSms) are re-pointed to the kept row; rows that would violate
 * a unique constraint are dropped. Duplicate leads are then deleted.
 *
 * SAFE TO RE-RUN: it only merges groups that still have >1 row.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { phoneMatchKey } from "../src/lib/services/lead-identity";

const prisma = new PrismaClient();

async function groupByMapsLink(): Promise<Map<string, string[]>> {
  const groups = await prisma.lead.groupBy({
    by: ["googleMapsLink"],
    where: { googleMapsLink: { not: null } },
    _count: { _all: true },
    having: { googleMapsLink: { _count: { gt: 1 } } },
  });
  const map = new Map<string, string[]>();
  for (const g of groups) {
    const rows = await prisma.lead.findMany({
      where: { googleMapsLink: g.googleMapsLink },
      select: { id: true },
    });
    map.set(g.googleMapsLink!, rows.map((r) => r.id));
  }
  return map;
}

async function groupByPhone(): Promise<Map<string, string[]>> {
  const withPhone = await prisma.lead.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });
  const byKey = new Map<string, string[]>();
  for (const l of withPhone) {
    const key = phoneMatchKey(l.phone);
    const arr = byKey.get(key) ?? [];
    arr.push(l.id);
    byKey.set(key, arr);
  }
  const out = new Map<string, string[]>();
  for (const [key, ids] of byKey) {
    if (ids.length > 1) out.set(key, ids);
  }
  return out;
}

class UnionFind {
  parent = new Map<string, string>();
  find(id: string): string {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      return id;
    }
    if (this.parent.get(id) !== id) {
      this.parent.set(id, this.find(this.parent.get(id)!));
    }
    return this.parent.get(id)!;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

async function pickKeeper(ids: string[]) {
  const rows = await prisma.lead.findMany({ where: { id: { in: ids } } });
  return rows
    .slice()
    .sort((a, b) => {
      if (b.leadScore !== a.leadScore) return b.leadScore - a.leadScore;
      const countFields = (l: (typeof rows)[number]) =>
        Object.entries(l).filter(
          ([k, v]) => k !== "createdAt" && v !== null && v !== "" && v !== 0,
        ).length;
      const diff = countFields(b) - countFields(a);
      if (diff !== 0) return diff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })[0];
}

type Crud = {
  findMany: (args: any) => Promise<Array<{ id: string; leadId: string }>>;
  update: (args: any) => Promise<unknown>;
  delete: (args: any) => Promise<unknown>;
};

async function repoint(
  table: Crud,
  dupId: string,
  keeperId: string,
) {
  const rows = await table.findMany({ where: { leadId: dupId } });
  for (const row of rows) {
    try {
      await table.update({ where: { id: row.id }, data: { leadId: keeperId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        await table.delete({ where: { id: row.id } });
      } else {
        throw e;
      }
    }
  }
}

async function main() {
  const totalBefore = await prisma.lead.count();
  const mapGroups = await groupByMapsLink();
  const phoneGroups = await groupByPhone();

  const uf = new UnionFind();
  for (const ids of [...mapGroups.values(), ...phoneGroups.values()]) {
    for (let i = 1; i < ids.length; i++) uf.union(ids[0], ids[i]);
  }

  const components = new Map<string, string[]>();
  for (const id of uf.parent.keys()) {
    const root = uf.find(id);
    const arr = components.get(root) ?? [];
    arr.push(id);
    components.set(root, arr);
  }

  let mergedGroups = 0;
  let deletedCount = 0;
  for (const ids of components.values()) {
    if (ids.length < 2) continue;
    const keeper = await pickKeeper(ids);
    const dupIds = ids.filter((id) => id !== keeper.id);
    for (const dupId of dupIds) {
      await repoint(prisma.savedLead, dupId, keeper.id);
      await repoint(prisma.leadUnlock, dupId, keeper.id);
      await repoint(prisma.leadEmail, dupId, keeper.id);
      await repoint(prisma.leadSms, dupId, keeper.id);
      await prisma.lead.delete({ where: { id: dupId } });
      deletedCount += 1;
    }
    mergedGroups += 1;
  }

  const totalAfter = await prisma.lead.count();
  console.log(`total before: ${totalBefore}`);
  console.log(`merged groups: ${mergedGroups}`);
  console.log(`deleted duplicate rows: ${deletedCount}`);
  console.log(`total after: ${totalAfter}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
