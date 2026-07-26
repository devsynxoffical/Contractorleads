import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto-secret";
import { appBaseUrl } from "@/lib/email-brand";
import { requireSessionSecret } from "@/lib/server-secrets";

const GRAPH = "https://graph.facebook.com/v21.0";
const OAUTH_SCOPES = ["public_profile", "email", "pages_show_list"].join(",");

export function getMetaAppCredentials() {
  const appId = (
    process.env.META_APP_ID ||
    process.env.FACEBOOK_APP_ID ||
    ""
  ).trim();
  const appSecret = (
    process.env.META_APP_SECRET ||
    process.env.FACEBOOK_APP_SECRET ||
    ""
  ).trim();
  return { appId, appSecret };
}

export function isFacebookOAuthConfigured() {
  const { appId, appSecret } = getMetaAppCredentials();
  return Boolean(appId && appSecret);
}

export function facebookOAuthRedirectUri() {
  return `${appBaseUrl()}/api/integrations/facebook/callback`;
}

function signState(payload: string) {
  const key = requireSessionSecret();
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyState(state: string): { userId: string; nonce: string } | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const key = requireSessionSecret();
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
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
    ) as { userId?: string; nonce?: string; exp?: number };
    if (!parsed.userId || !parsed.nonce) return null;
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return { userId: parsed.userId, nonce: parsed.nonce };
  } catch {
    return null;
  }
}

export function buildFacebookOAuthUrl(opts: { userId: string }) {
  const { appId } = getMetaAppCredentials();
  if (!appId) throw new Error("META_APP_ID is not configured");

  const payload = Buffer.from(
    JSON.stringify({
      userId: opts.userId,
      nonce: randomBytes(8).toString("hex"),
      exp: Date.now() + 15 * 60 * 1000,
    }),
    "utf8",
  ).toString("base64url");

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", facebookOAuthRedirectUri());
  url.searchParams.set("state", signState(payload));
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export function parseFacebookOAuthState(state: string) {
  return verifyState(state);
}

async function exchangeCodeForToken(opts: { code: string }) {
  const { appId, appSecret } = getMetaAppCredentials();
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", facebookOAuthRedirectUri());
  url.searchParams.set("code", opts.code);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || "Facebook token exchange failed");
  }
  return data;
}

async function exchangeLongLivedToken(shortToken: string) {
  const { appId, appSecret } = getMetaAppCredentials();
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    // Fall back to short-lived token if long-lived exchange fails
    return { access_token: shortToken, expires_in: 60 * 60 };
  }
  return data;
}

async function fetchFacebookProfile(accessToken: string) {
  const url = new URL(`${GRAPH}/me`);
  url.searchParams.set("fields", "id,name,email,picture.type(large)");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  const data = (await res.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
    error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || "Could not load Facebook profile");
  }
  return {
    id: data.id,
    name: data.name ?? null,
    email: data.email ?? null,
    pictureUrl: data.picture?.data?.url ?? null,
  };
}

export async function disconnectFacebook(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      facebookUserId: null,
      facebookName: null,
      facebookPictureUrl: null,
      facebookAccessTokenEnc: null,
      facebookTokenExpiresAt: null,
      facebookConnectedAt: null,
    },
  });
}

export async function completeFacebookOAuth(opts: {
  userId: string;
  code: string;
  state: string;
}) {
  const parsed = parseFacebookOAuthState(opts.state);
  if (!parsed || parsed.userId !== opts.userId) {
    throw new Error("Invalid or expired Facebook login state");
  }

  if (!isFacebookOAuthConfigured()) {
    throw new Error("Facebook OAuth is not configured on this server");
  }

  const short = await exchangeCodeForToken({
    code: opts.code,
  });
  const longLived = await exchangeLongLivedToken(short.access_token!);
  const profile = await fetchFacebookProfile(longLived.access_token!);

  const expiresAt = longLived.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000)
    : null;

  try {
    await prisma.user.update({
      where: { id: opts.userId },
      data: {
        facebookUserId: profile.id,
        facebookName: profile.name,
        facebookPictureUrl: profile.pictureUrl,
        facebookAccessTokenEnc: encryptSecret(longLived.access_token!),
        facebookTokenExpiresAt: expiresAt,
        facebookConnectedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[facebook] failed to save connection", err);
    throw new Error(
      "Connected to Facebook but could not save your profile. Ask your admin to run a database migrate, then try again.",
    );
  }

  return profile;
}

export async function getFacebookConnection(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        facebookUserId: true,
        facebookName: true,
        facebookPictureUrl: true,
        facebookTokenExpiresAt: true,
        facebookConnectedAt: true,
        facebookAccessTokenEnc: true,
      },
    });
    if (!user?.facebookUserId) {
      return {
        connected: false as const,
        oauthConfigured: isFacebookOAuthConfigured(),
      };
    }
    const expired =
      user.facebookTokenExpiresAt != null &&
      user.facebookTokenExpiresAt.getTime() < Date.now();
    return {
      connected: true as const,
      oauthConfigured: isFacebookOAuthConfigured(),
      expired,
      profile: {
        id: user.facebookUserId,
        name: user.facebookName,
        pictureUrl: user.facebookPictureUrl,
        connectedAt: user.facebookConnectedAt?.toISOString() ?? null,
        expiresAt: user.facebookTokenExpiresAt?.toISOString() ?? null,
      },
    };
  } catch (err) {
    // Schema not migrated yet, or DB error — hub should still load
    console.error("[facebook] getFacebookConnection failed", err);
    return {
      connected: false as const,
      oauthConfigured: isFacebookOAuthConfigured(),
      schemaPending: true as const,
    };
  }
}

/** Prefer the user's connected token; fall back to platform Meta token. */
export async function resolveMetaAccessTokenForUser(
  userId: string,
): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        facebookAccessTokenEnc: true,
        facebookTokenExpiresAt: true,
      },
    });
    if (
      user?.facebookAccessTokenEnc &&
      (!user.facebookTokenExpiresAt ||
        user.facebookTokenExpiresAt.getTime() > Date.now() + 60_000)
    ) {
      try {
        return decryptSecret(user.facebookAccessTokenEnc);
      } catch {
        /* fall through */
      }
    }
  } catch {
    /* schema not migrated — fall through to platform token */
  }

  const platform = process.env.META_ACCESS_TOKEN?.trim();
  if (platform) return platform;

  const { appId, appSecret } = getMetaAppCredentials();
  if (appId && appSecret) return `${appId}|${appSecret}`;
  return null;
}
