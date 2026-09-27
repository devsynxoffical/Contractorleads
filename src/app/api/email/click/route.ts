import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Click-tracking redirect wrapper.
 * /api/email/click?t=<trackingToken>&url=<encodedUrl>
 */
export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const token = urlObj.searchParams.get("t");
  const targetUrl = urlObj.searchParams.get("url") || "https://contractorleads.us";

  let safeTarget = targetUrl;
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      safeTarget = "https://contractorleads.us";
    }
  } catch {
    safeTarget = "https://contractorleads.us";
  }

  if (token) {
    try {
      const now = new Date();
      const campaignLog = await prisma.campaignLog.findFirst({
        where: { trackingToken: token },
        select: { id: true, prospectId: true, clickedAt: true },
      });
      if (campaignLog) {
        if (!campaignLog.clickedAt) {
          await prisma.campaignLog.update({
            where: { id: campaignLog.id },
            data: { clickedAt: now, status: "clicked" },
          });
        }
        await prisma.campaignProspect.update({
          where: { id: campaignLog.prospectId },
          data: {
            clickedAt: now,
            clickCount: { increment: 1 },
          },
        });
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.redirect(safeTarget, { status: 302 });
}
