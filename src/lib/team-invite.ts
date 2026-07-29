import { createHmac, timingSafeEqual } from "crypto";
import { requireSessionSecret } from "@/lib/server-secrets";
import { appBaseUrl } from "@/lib/email-brand";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function sign(payload: string) {
  return createHmac("sha256", requireSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createTeamInviteToken(opts: {
  memberId: string;
  ownerUserId: string;
  email: string;
}) {
  const exp = Date.now() + INVITE_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({
      mid: opts.memberId,
      oid: opts.ownerUserId,
      email: opts.email.toLowerCase(),
      exp,
    }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseTeamInviteToken(token: string): {
  memberId: string;
  ownerUserId: string;
  email: string;
} | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      mid?: string;
      oid?: string;
      email?: string;
      exp?: number;
    };
    if (!parsed.mid || !parsed.oid || !parsed.email || !parsed.exp) return null;
    if (parsed.exp < Date.now()) return null;
    return {
      memberId: parsed.mid,
      ownerUserId: parsed.oid,
      email: parsed.email.toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function teamInviteAcceptUrl(token: string, baseUrl?: string) {
  const base = (baseUrl || appBaseUrl()).replace(/\/$/, "");
  return `${base}/invite/team?token=${encodeURIComponent(token)}`;
}

export function serializeTeamMember(m: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  invitedAt: Date;
  acceptedAt: Date | null;
}) {
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    status: m.status,
    invitedAt: m.invitedAt.toISOString(),
    acceptedAt: m.acceptedAt?.toISOString() ?? null,
  };
}
