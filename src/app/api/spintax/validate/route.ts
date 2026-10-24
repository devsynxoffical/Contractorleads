import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { validateSpintax } from "@/lib/spintax-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const template = body.template || "";
  const subjectTemplate = body.subjectTemplate || "";

  const report = validateSpintax(template, subjectTemplate);

  return NextResponse.json({
    ok: true,
    ...report,
  });
}
