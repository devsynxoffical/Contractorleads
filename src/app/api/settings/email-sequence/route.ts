import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ sequence, enrollments });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const data = {
    name: String(body.name || DEFAULTS.name).slice(0, 80),
    enabled: body.enabled !== false,
    day1Subject: String(body.day1Subject || "").slice(0, 200),
    day1Body: String(body.day1Body || ""),
    day2Subject: String(body.day2Subject || "").slice(0, 200),
    day2Body: String(body.day2Body || ""),
    day3Subject: String(body.day3Subject || "").slice(0, 200),
    day3Body: String(body.day3Body || ""),
  };

  const sequence = await prisma.emailSequence.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({ sequence });
}
