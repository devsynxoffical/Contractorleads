import { NextResponse } from "next/server";

/** Lightweight readiness probe for Railway / load balancers (no DB). */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
