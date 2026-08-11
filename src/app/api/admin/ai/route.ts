import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AI_MODEL_OPTIONS, getAiBrain } from "@/lib/ai-config";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, config: await getAiBrain() });
}

export async function PUT(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

  const model = str(body.model);
  const outreachModel = str(body.outreachModel);
  if (
    model &&
    !(AI_MODEL_OPTIONS as readonly string[]).includes(model)
  ) {
    return NextResponse.json(
      { error: `Unsupported model "${model}".` },
      { status: 400 },
    );
  }
  if (
    outreachModel &&
    !(AI_MODEL_OPTIONS as readonly string[]).includes(outreachModel)
  ) {
    return NextResponse.json(
      { error: `Unsupported outreach model "${outreachModel}".` },
      { status: 400 },
    );
  }

  // Blank prompt overrides are stored as null so the built-in prompt is used.
  const prompt = (v: unknown): string | null => {
    const s = str(v);
    return s.length > 0 ? s : null;
  };

  await prisma.aiBrainConfig.upsert({
    where: { id: "default" },
    update: {
      enabled: body.enabled !== false,
      globalInstructions: str(body.globalInstructions),
      knowledgeBase: str(body.knowledgeBase),
      askExpertPrompt: prompt(body.askExpertPrompt),
      supportBotPrompt: prompt(body.supportBotPrompt),
      emailPrompt: prompt(body.emailPrompt),
      smsPrompt: prompt(body.smsPrompt),
      followupPrompt: prompt(body.followupPrompt),
      salesScriptPrompt: prompt(body.salesScriptPrompt),
      model: model || "gpt-4o-mini",
      outreachModel: outreachModel || "gpt-4o-mini",
    },
    create: {
      id: "default",
      enabled: body.enabled !== false,
      globalInstructions: str(body.globalInstructions),
      knowledgeBase: str(body.knowledgeBase),
      askExpertPrompt: prompt(body.askExpertPrompt),
      supportBotPrompt: prompt(body.supportBotPrompt),
      emailPrompt: prompt(body.emailPrompt),
      smsPrompt: prompt(body.smsPrompt),
      followupPrompt: prompt(body.followupPrompt),
      salesScriptPrompt: prompt(body.salesScriptPrompt),
      model: model || "gpt-4o-mini",
      outreachModel: outreachModel || "gpt-4o-mini",
    },
  });

  return NextResponse.json({ ok: true, config: await getAiBrain() });
}
