import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.contractorleads.us";
const APEX_HOST = "contractorleads.us";

/**
 * Send apex traffic to www so Google indexes one preferred host.
 * Localhost / Railway / preview hosts are left alone.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
