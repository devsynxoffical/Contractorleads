import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// 1x1 Transparent GIF buffer (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const CORS_HEADERS = {
  "Content-Type": "image/gif",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * High-performance Open-tracking pixel endpoint.
 * Embedded as <img src="https://www.contractorleads.us/api/email/open?t=<token>" />
 * Tracks opens for Campaign Prospects, Campaign Logs, and Lead Emails.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get("t") || url.searchParams.get("token") || "").trim();

    if (token) {
      const now = new Date();

      // 1. Process Campaign Logs & Prospects
      const campaignLog = await prisma.campaignLog.findFirst({
        where: { trackingToken: token },
        select: {
          id: true,
          prospectId: true,
          campaignId: true,
          openedAt: true,
          status: true,
        },
      });

      if (campaignLog) {
        // Mark log opened if not already opened
        if (!campaignLog.openedAt) {
          await prisma.campaignLog.update({
            where: { id: campaignLog.id },
            data: {
              openedAt: now,
              status: campaignLog.status === "sent" ? "opened" : campaignLog.status,
            },
          });
        }

        // Update Prospect open state and increment open counter
        if (campaignLog.prospectId) {
          await prisma.campaignProspect.update({
            where: { id: campaignLog.prospectId },
            data: {
              openedAt: now,
              openCount: { increment: 1 },
            },
          });
        }
      }

      // 2. Process Direct Lead Emails
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
    }
  } catch (err) {
    // Fail silently so the email client always receives the transparent gif without error
    console.error("[Email Open Tracking Error]", err);
  }

  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
