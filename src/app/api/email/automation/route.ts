import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDueEnrollments, processEnrollment } from "@/lib/email-automation";

/** Enroll saved leads into Day 1/2/3 automation */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const action = body.action || "enroll";

  if (action === "process") {
    const results = await processDueEnrollments({ userId: user.id, take: 40 });
    return NextResponse.json({ results });
  }

  const savedLeadIds: string[] = Array.isArray(body.savedLeadIds)
    ? body.savedLeadIds.map(String)
    : body.savedLeadId
      ? [String(body.savedLeadId)]
      : [];

  if (!savedLeadIds.length) {
    return NextResponse.json({ error: "savedLeadIds required" }, { status: 400 });
  }

  let sequence = await prisma.emailSequence.findUnique({ where: { userId: user.id } });
  if (!sequence) {
    sequence = await prisma.emailSequence.create({ data: { userId: user.id } });
  }

  const smtp = await prisma.userSmtpSettings.findUnique({ where: { userId: user.id } });
  if (!smtp?.enabled) {
    return NextResponse.json(
      { error: "Configure and enable SMTP in Settings before enrolling leads" },
      { status: 400 },
    );
  }

  const created = [];
  for (const savedLeadId of savedLeadIds) {
    const saved = await prisma.savedLead.findFirst({
      where: { id: savedLeadId, userId: user.id },
      include: { lead: true },
    });
    if (!saved) continue;
    if (!saved.lead.email) continue;

    const row = await prisma.emailEnrollment.upsert({
      where: {
        userId_savedLeadId: { userId: user.id, savedLeadId },
      },
      create: {
        userId: user.id,
        sequenceId: sequence.id,
        savedLeadId,
        status: "active",
      },
      update: {
        status: "active",
        day1SentAt: null,
        day2SentAt: null,
        day3SentAt: null,
        lastError: null,
        sequenceId: sequence.id,
      },
    });
    created.push(row.id);
    // Send Day 1 immediately
    await processEnrollment(row.id);
  }

  return NextResponse.json({ enrolled: created.length, ids: created });
}
