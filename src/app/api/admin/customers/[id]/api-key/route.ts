import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiKey } from "@/lib/api-access";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, plan: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const created = createApiKey();
  await prisma.user.update({
    where: { id },
    data: {
      apiKeyHash: created.hash,
      apiKeyLast4: created.last4,
      apiEnabled: true,
    },
  });

  return NextResponse.json({
    apiKey: created.raw,
    last4: created.last4,
    note: "Store this key now. It will not be shown again.",
  });
}
