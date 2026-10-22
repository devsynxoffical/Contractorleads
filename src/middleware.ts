import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.contractorleads.us";
const APEX_HOST = "contractorleads.us";

/**
 * Send apex traffic to www so Google indexes one preferred host.
 * Localhost / Railway / preview hosts are left alone.
 */
export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host")?.toLowerCase() ?? "";
  const hostname = hostHeader.split(":")[0];
  const url = new URL(request.url);

  // 1. Apex to canonical www redirect (one hop to https://www.contractorleads.us)
  if (hostname === APEX_HOST) {
    const dest = new URL(request.url);
    dest.protocol = "https:";
    dest.hostname = CANONICAL_HOST;
    dest.port = "";
    // also normalize pathname to lowercase if needed
    if (dest.pathname !== dest.pathname.toLowerCase()) {
      dest.pathname = dest.pathname.toLowerCase();
    }
    return NextResponse.redirect(dest, 308);
  }

  // 2. Normalize uppercase URL paths to lowercase (e.g. /Pricing -> /pricing, /industries/roofing/TEXAS -> /industries/roofing/texas)
  if (url.pathname !== url.pathname.toLowerCase()) {
    const dest = new URL(request.url);
    dest.pathname = dest.pathname.toLowerCase();
    return NextResponse.redirect(dest, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
