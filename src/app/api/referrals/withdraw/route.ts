import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requestWithdrawal } from "@/lib/referrals";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const amountUsd = Number(body.amountUsd);
  const methodRaw = String(body.method || "paypal").toLowerCase();
  const method =
    methodRaw === "bank" || methodRaw === "other" ? methodRaw : "paypal";
  const payoutDetails = String(body.payoutDetails || "");

  const result = await requestWithdrawal({
    userId: user.id,
    amountUsd,
    method,
    payoutDetails,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    withdrawal: {
      id: result.withdrawal.id,
      amountUsd: result.withdrawal.amountUsd,
      method: result.withdrawal.method,
      status: result.withdrawal.status,
      createdAt: result.withdrawal.createdAt,
    },
  });
}
