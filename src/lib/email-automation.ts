import { prisma } from "@/lib/prisma";
import { renderSequenceTemplate, sendViaUserSmtp } from "@/lib/user-smtp";

export type SequenceStep = {
  /** Day offset from enrollment (1 = immediately on enroll). */
  day: number;
  subject: string;
  body: string;
};

export const MAX_SEQUENCE_STEPS = 15;
export const MAX_SEQUENCE_DAY = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Canonical steps for a sequence. Prefers stepsJson; falls back to the
 * legacy day1–3 columns so pre-multi-day sequences keep working untouched.
 */
export function parseSequenceSteps(sequence: {
  stepsJson?: string | null;
  day1Subject: string;
  day1Body: string;
  day2Subject: string;
  day2Body: string;
  day3Subject: string;
  day3Body: string;
}): SequenceStep[] {
  if (sequence.stepsJson) {
    try {
      const parsed = JSON.parse(sequence.stepsJson) as unknown;
      if (Array.isArray(parsed)) {
        const steps = parsed
          .map((s) => ({
            day: Math.floor(Number((s as SequenceStep)?.day)),
            subject: String((s as SequenceStep)?.subject ?? ""),
            body: String((s as SequenceStep)?.body ?? ""),
          }))
          .filter(
            (s) =>
              Number.isFinite(s.day) &&
              s.day >= 1 &&
              s.day <= MAX_SEQUENCE_DAY &&
              (s.subject.trim() || s.body.trim()),
          )
          .sort((a, b) => a.day - b.day)
          .slice(0, MAX_SEQUENCE_STEPS);
        if (steps.length) return steps;
      }
    } catch {
      /* fall through to legacy columns */
    }
  }
  return [
    { day: 1, subject: sequence.day1Subject, body: sequence.day1Body },
    { day: 2, subject: sequence.day2Subject, body: sequence.day2Body },
    { day: 3, subject: sequence.day3Subject, body: sequence.day3Body },
  ];
}

/** Sanitize client-submitted steps into a valid, sorted schedule. */
export function normalizeSteps(input: unknown): SequenceStep[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<number>();
  const steps: SequenceStep[] = [];
  for (const raw of input) {
    const day = Math.floor(Number((raw as SequenceStep)?.day));
    const subject = String((raw as SequenceStep)?.subject ?? "").slice(0, 200);
    const body = String((raw as SequenceStep)?.body ?? "").slice(0, 5000);
    if (!Number.isFinite(day) || day < 1 || day > MAX_SEQUENCE_DAY) continue;
    if (!subject.trim() && !body.trim()) continue;
    if (seen.has(day)) continue;
    seen.add(day);
    steps.push({ day, subject, body });
  }
  return steps.sort((a, b) => a.day - b.day).slice(0, MAX_SEQUENCE_STEPS);
}

/** ISO timestamps of steps already sent, merging legacy day1–3 columns. */
export function parseSentTimes(enrollment: {
  stepsSentJson?: string | null;
  day1SentAt: Date | null;
  day2SentAt: Date | null;
  day3SentAt: Date | null;
}): Date[] {
  if (enrollment.stepsSentJson) {
    try {
      const parsed = JSON.parse(enrollment.stepsSentJson) as unknown;
      if (Array.isArray(parsed)) {
        const dates = parsed
          .map((v) => new Date(String(v)))
          .filter((d) => !Number.isNaN(d.getTime()));
        if (dates.length) return dates;
      }
    } catch {
      /* fall through */
    }
  }
  const legacy: Date[] = [];
  if (enrollment.day1SentAt) legacy.push(enrollment.day1SentAt);
  if (enrollment.day2SentAt) legacy.push(enrollment.day2SentAt);
  if (enrollment.day3SentAt) legacy.push(enrollment.day3SentAt);
  return legacy;
}

/**
 * Whether the next unsent step is due. The first step sends immediately on
 * enroll; each later step sends once the day gap since the previous send
 * (or enrollment) has elapsed.
 */
function nextStepDue(
  steps: SequenceStep[],
  sent: Date[],
  createdAt: Date,
): boolean {
  const index = sent.length;
  if (index >= steps.length) return false;
  if (index === 0) return true;
  const gapDays = Math.max(1, steps[index].day - steps[index - 1].day);
  const base = sent[index - 1]?.getTime() ?? createdAt.getTime();
  return Date.now() - base >= gapDays * DAY_MS;
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

  const steps = parseSequenceSteps(enrollment.sequence);
  const sent = parseSentTimes(enrollment);
  const index = sent.length;

  if (index >= steps.length) {
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "completed" },
    });
    return { skipped: true as const };
  }
  if (!nextStepDue(steps, sent, enrollment.createdAt)) {
    return { skipped: true as const };
  }

  const lead = enrollment.savedLead.lead;
  const to = lead.email?.trim();
  if (!to) {
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "failed", lastError: "Lead has no email" },
    });
    return { error: "no email" as const };
  }

  const step = steps[index];
  const vars = {
    ownerName: lead.ownerName || "there",
    businessName: lead.businessName,
    fromName:
      enrollment.user.ownerName ||
      enrollment.user.name ||
      enrollment.user.companyName ||
      "Our team",
  };
  const subject = renderSequenceTemplate(step.subject, vars);
  const text = renderSequenceTemplate(step.body, vars);

  try {
    const sentMail = await sendViaUserSmtp({
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
        smtpAccountId: sentMail.smtpAccountId,
        direction: "outbound",
        fromEmail: sentMail.fromEmail,
        toEmail: to,
        subject,
        body: text,
        status: "sent",
        messageId: sentMail.messageId,
        enrollmentId: enrollment.id,
      },
    });

    const now = new Date();
    const nextSent = [...sent, now];
    const patch: Record<string, unknown> = {
      lastError: null,
      updatedAt: now,
      stepsSentJson: JSON.stringify(nextSent.map((d) => d.toISOString())),
    };
    // Mirror the first three sends into legacy columns for older dashboards.
    if (index === 0) patch.day1SentAt = now;
    if (index === 1) patch.day2SentAt = now;
    if (index === 2) patch.day3SentAt = now;
    if (nextSent.length >= steps.length) patch.status = "completed";

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
    return { sent: index + 1, day: step.day, to };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    await prisma.emailEnrollment.update({
      where: { id: enrollment.id },
      data: { lastError: msg },
    });
    return { error: msg };
  }
}

/** Process due sequence sends for one user (or all users when userId omitted). */
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
