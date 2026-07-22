import { prisma } from "@/lib/prisma";
import { renderSequenceTemplate, sendViaUserSmtp } from "@/lib/user-smtp";

function dayIndex(enrollment: {
  day1SentAt: Date | null;
  day2SentAt: Date | null;
  day3SentAt: Date | null;
}) {
  if (!enrollment.day1SentAt) return 1;
  if (!enrollment.day2SentAt) return 2;
  if (!enrollment.day3SentAt) return 3;
  return null;
}

function dueForDay(
  enrollment: {
    createdAt: Date;
    day1SentAt: Date | null;
    day2SentAt: Date | null;
  },
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

export async function processEnrollment(enrollmentId: string) {
  const enrollment = await prisma.emailEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      sequence: true,
      savedLead: { include: { lead: true } },
      user: { select: { name: true, companyName: true, ownerName: true } },
    },
  });
  if (!enrollment || enrollment.status !== "active") return { skipped: true as const };
  if (!enrollment.sequence.enabled) return { skipped: true as const };

  const day = dayIndex(enrollment);
  if (!day || !dueForDay(enrollment, day)) return { skipped: true as const };

  const lead = enrollment.savedLead.lead;
  const to = lead.email?.trim();
  if (!to) {
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "failed", lastError: "Lead has no email" },
    });
    return { error: "no email" as const };
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
    const sent = await sendViaUserSmtp({
      userId: enrollment.userId,
      to,
      subject,
      text,
    });
    await prisma.leadEmail.create({
      data: {
        userId: enrollment.userId,
        leadId: lead.id,
        savedLeadId: enrollment.savedLeadId,
        smtpAccountId: sent.smtpAccountId,
        direction: "outbound",
        fromEmail: sent.fromEmail,
        toEmail: to,
        subject,
        body: text,
        status: "sent",
        messageId: sent.messageId,
        enrollmentId: enrollment.id,
      },
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
    if (enrollment.savedLead.status === "new") {
      await prisma.savedLead.update({
        where: { id: enrollment.savedLeadId },
        data: { status: "contacted" },
      });
    }
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

/** Process due Day 1–3 sends for one user (or all users when userId omitted). */
export async function processDueEnrollments(opts?: {
  userId?: string;
  take?: number;
}) {
  const take = opts?.take ?? 40;
  const active = await prisma.emailEnrollment.findMany({
    where: {
      status: "active",
      ...(opts?.userId ? { userId: opts.userId } : {}),
    },
    take,
    orderBy: { createdAt: "asc" },
  });
  const results = [];
  for (const row of active) {
    results.push(await processEnrollment(row.id));
  }
  return results;
}
