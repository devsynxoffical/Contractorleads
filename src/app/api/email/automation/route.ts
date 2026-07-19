import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderSequenceTemplate, sendViaUserSmtp } from "@/lib/user-smtp";

function dayIndex(enrollment: {
  day1SentAt: Date | null;
  day2SentAt: Date | null;
  day3SentAt: Date | null;
  createdAt: Date;
}) {
  if (!enrollment.day1SentAt) return 1;
  if (!enrollment.day2SentAt) return 2;
  if (!enrollment.day3SentAt) return 3;
  return null;
}

function dueForDay(
  enrollment: { createdAt: Date; day1SentAt: Date | null; day2SentAt: Date | null },
  day: number,
) {
  const now = Date.now();
  const start = enrollment.createdAt.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (day === 1) return true;
  if (day === 2) {
    const base = enrollment.day1SentAt?.getTime() ?? start;
    return now - base >= dayMs;
  }
  if (day === 3) {
    const base = enrollment.day2SentAt?.getTime() ?? start;
    return now - base >= dayMs;
  }
  return false;
}

async function processEnrollment(enrollmentId: string) {
  const enrollment = await prisma.emailEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      sequence: true,
      savedLead: { include: { lead: true } },
      user: { select: { name: true, companyName: true, ownerName: true } },
    },
  });
  if (!enrollment || enrollment.status !== "active") return { skipped: true };
  if (!enrollment.sequence.enabled) return { skipped: true };

  const day = dayIndex(enrollment);
  if (!day || !dueForDay(enrollment, day)) return { skipped: true };

  const lead = enrollment.savedLead.lead;
  const to = lead.email?.trim();
  if (!to) {
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "failed", lastError: "Lead has no email" },
    });
    return { error: "no email" };
  }

  const subjectKey = `day${day}Subject` as "day1Subject" | "day2Subject" | "day3Subject";
  const bodyKey = `day${day}Body` as "day1Body" | "day2Body" | "day3Body";
  const vars = {
    ownerName: lead.ownerName || "there",
    businessName: lead.businessName,
    fromName:
      enrollment.user.ownerName ||
      enrollment.user.name ||
      enrollment.user.companyName ||
      "Our team",
  };
  const subject = renderSequenceTemplate(enrollment.sequence[subjectKey], vars);
  const text = renderSequenceTemplate(enrollment.sequence[bodyKey], vars);

  try {
    await sendViaUserSmtp({
      userId: enrollment.userId,
      to,
      subject,
      text,
    });
    const patch: Record<string, unknown> = {
      lastError: null,
      updatedAt: new Date(),
    };
    if (day === 1) patch.day1SentAt = new Date();
    if (day === 2) patch.day2SentAt = new Date();
    if (day === 3) {
      patch.day3SentAt = new Date();
      patch.status = "completed";
    }
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: patch,
    });
    return { sent: day, to };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: { lastError: msg },
    });
    return { error: msg };
  }
}

/** Enroll saved leads into Day 1/2/3 automation */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const action = body.action || "enroll";

  if (action === "process") {
    const active = await prisma.emailEnrollment.findMany({
      where: { userId: user.id, status: "active" },
      take: 40,
      orderBy: { createdAt: "asc" },
    });
    const results = [];
    for (const row of active) {
      results.push(await processEnrollment(row.id));
    }
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
