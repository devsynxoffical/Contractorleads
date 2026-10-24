import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { renderOutreachEmail } from "@/lib/spintax-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const subjectTemplate = body.subject || "";
  const bodyTemplate = body.body || "";
  const preheaderTemplate = body.preheader || "";
  const signature = body.signature || "";
  const lead = body.lead || {};
  const campaignId = body.campaignId || "preview-camp";
  const stepId = body.stepId || "preview-step";

  const render = renderOutreachEmail(
    {
      subject: subjectTemplate,
      body: bodyTemplate,
      preheader: preheaderTemplate,
      signature,
    },
    lead,
    {
      campaignId,
      stepId,
      leadId: lead.id || lead.email || "sample",
      mode: "random",
    }
  );

  return NextResponse.json({
    ok: true,
    rendered: render,
  });
}
