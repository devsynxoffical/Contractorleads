import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRotationConfig,
  saveUserRotationConfig,
  type EmailRotationConfig,
} from "@/lib/email-rotation";
import { listAvailableSenders } from "@/lib/user-smtp";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getUserRotationConfig(user.id);
  const senders = await listAvailableSenders(user.id);

  // Group senders by domain
  const domainMap = new Map<string, number>();
  for (const acc of senders.accounts) {
    if (!acc.enabled) continue;
    const domain = acc.fromEmail.split("@")[1]?.toLowerCase() || "custom";
    domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
  }

  const distinctDomains = Array.from(domainMap.keys());
  const totalActiveMailboxes = senders.accounts.filter((a) => a.enabled).length;

  return NextResponse.json({
    config,
    totalMailboxes: totalActiveMailboxes,
    totalDomains: distinctDomains.length,
    domains: distinctDomains,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Partial<EmailRotationConfig>;
  const updated = await saveUserRotationConfig(user.id, body);

  return NextResponse.json({ ok: true, config: updated });
}

export async function PUT(request: Request) {
  return POST(request);
}
