import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeSteps,
  parseSequenceSteps,
  parseSentTimes,
} from "@/lib/email-automation";

const DEFAULTS = {
  name: "Lead nurture",
  enabled: true,
  day1Subject: "Quick intro",
  day1Body:
    "Hi {{ownerName}},\n\nI noticed {{businessName}} and thought we could help with more booked jobs.\n\nWorth a quick chat?\n\n{{fromName}}",
  day2Subject: "Following up",
  day2Body:
    "Hi {{ownerName}},\n\nJust bumping this in case you missed it — happy to share how agencies like yours are filling their calendar.\n\n{{fromName}}",
  day3Subject: "Last note from me",
  day3Body:
    "Hi {{ownerName}},\n\nI'll close the loop here. If timing is better later, just reply and I'll send details.\n\n{{fromName}}",
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sequence = await prisma.emailSequence.findUnique({ where: { userId: user.id } });
  if (!sequence) {
    sequence = await prisma.emailSequence.create({
      data: { userId: user.id, ...DEFAULTS },
    });
  }

  const enrollments = await prisma.emailEnrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      savedLead: {
        include: {
          lead: {
            select: {
              businessName: true,
              email: true,
              ownerName: true,
            },
          },
        },
      },
    },
  });

  const steps = parseSequenceSteps(sequence);
  return NextResponse.json({
    sequence,
    steps,
    enrollments: enrollments.map((en) => ({
      ...en,
      sentCount: parseSentTimes(en).length,
      totalSteps: steps.length,
    })),
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // New multi-day payload: { steps: [{day, subject, body}, …] }
  const steps = normalizeSteps(body.steps);
  const legacyFromBody = {
    day1Subject: String(body.day1Subject || "").slice(0, 200),
    day1Body: String(body.day1Body || ""),
    day2Subject: String(body.day2Subject || "").slice(0, 200),
    day2Body: String(body.day2Body || ""),
    day3Subject: String(body.day3Subject || "").slice(0, 200),
    day3Body: String(body.day3Body || ""),
  };

  if (Array.isArray(body.steps) && steps.length === 0) {
    return NextResponse.json(
      { error: "Add at least one step with a subject or body" },
      { status: 400 },
    );
  }

  const data = {
    name: String(body.name || DEFAULTS.name).slice(0, 80),
    enabled: body.enabled !== false,
    ...(steps.length
      ? {
          stepsJson: JSON.stringify(steps),
          // Mirror the first three steps into legacy columns so anything
          // still reading them shows the current copy.
          day1Subject: steps[0]?.subject ?? DEFAULTS.day1Subject,
          day1Body: steps[0]?.body ?? DEFAULTS.day1Body,
          day2Subject: steps[1]?.subject ?? "",
          day2Body: steps[1]?.body ?? "",
          day3Subject: steps[2]?.subject ?? "",
          day3Body: steps[2]?.body ?? "",
        }
      : legacyFromBody),
  };

  const sequence = await prisma.emailSequence.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({ sequence, steps: parseSequenceSteps(sequence) });
}
