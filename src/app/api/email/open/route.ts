import { prisma } from "@/lib/prisma";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

/**
 * Open-tracking pixel. Loaded as an <img> inside outbound emails at
 * /api/email/open?t=<trackingToken>. Records openedAt, updates campaign stats,
 * then returns a transparent 1x1 GIF.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  if (token) {
    try {
      const now = new Date();

      // Check LeadEmail
      const leadEmail = await prisma.leadEmail.findFirst({
        where: { trackingToken: token },
        select: { id: true, openedAt: true },
      });
      if (leadEmail && !leadEmail.openedAt) {
        await prisma.leadEmail.update({
          where: { id: leadEmail.id },
          data: { openedAt: now },
        });
      }

      // Check CampaignLog
      const campaignLog = await prisma.campaignLog.findFirst({
        where: { trackingToken: token },
        select: { id: true, prospectId: true, openedAt: true },
      });
      if (campaignLog) {
        if (!campaignLog.openedAt) {
          await prisma.campaignLog.update({
            where: { id: campaignLog.id },
            data: { openedAt: now, status: "opened" },
          });
        }
        await prisma.campaignProspect.update({
          where: { id: campaignLog.prospectId },
          data: {
            openedAt: now,
            openCount: { increment: 1 },
          },
        });
      }
    } catch {
      // Never fail the pixel — an image load must not error the email client.
    }
  }
  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
