import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActivityTimeline,
  parseKinds,
  parsePeriod,
  periodStart,
  type ActivityEvent,
} from "@/lib/admin-user-activity";

export const dynamic = "force-dynamic";

function csvCell(v: string | null | undefined) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(events: ActivityEvent[]) {
  const head = ["Time (UTC)", "Type", "Status", "User email", "Company", "What happened", "Details", "Error"];
  const rows = events.map((e) =>
    [e.at, e.kind, e.status, e.user?.email, e.user?.companyName, e.title, e.detail, e.error].map(csvCell).join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

/**
 * Activity timeline across the platform, or for one user (?userId=).
 * ?kinds=email,campaign,sms,search,export,credits,account  ?before=<ISO cursor>  ?format=csv
 */
export async function GET(request: Request) {
  const admin = await requirePermission("activity");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));
  const userId = searchParams.get("userId")?.trim() || undefined;
  const kinds = parseKinds(searchParams.get("kinds"));
  const beforeRaw = searchParams.get("before");
  const before = beforeRaw && !Number.isNaN(Date.parse(beforeRaw)) ? new Date(beforeRaw) : undefined;
  const csv = searchParams.get("format") === "csv";
  const limit = csv ? 5000 : Math.min(100, Math.max(10, Number(searchParams.get("limit") ?? 50) || 50));

  const result = await getActivityTimeline({ userId, since: periodStart(period), before, kinds, limit });

  if (csv) {
    if (userId) {
      // Per-user timelines omit the user on each event; fill it in for the file.
      const owner = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, companyName: true },
      });
      for (const e of result.events) e.user = e.user ?? owner;
    }
    const name = `activity-${userId ? `user-${userId}` : "all"}-${period}.csv`;
    return new NextResponse(toCsv(result.events), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  }
  return NextResponse.json(result);
}
