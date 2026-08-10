import { prisma } from "@/lib/prisma";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

/**
 * Open-tracking pixel. Loaded as an <img> inside outbound lead emails at
 * /api/email/open?t=<trackingToken>. Records openedAt exactly once, then
 * always returns a transparent 1x1 GIF so the recipient never sees a break.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  if (token && /^[a-f0-9]{32}$/.test(token)) {
    try {
      const row = await prisma.leadEmail.findFirst({
        where: { trackingToken: token },
        select: { id: true, openedAt: true },
      });
      if (row && !row.openedAt) {
        await prisma.leadEmail.update({
          where: { id: row.id },
          data: { openedAt: new Date() },
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
