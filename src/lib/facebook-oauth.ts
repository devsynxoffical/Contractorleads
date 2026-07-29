import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { appBaseUrl } from "@/lib/email-brand";
import { requireSessionSecret } from "@/lib/server-secrets";
import {
  getMetaAppCredentials,
  isFacebookOAuthConfigured,
} from "@/lib/facebook-oauth-config";
import {
  clearFacebookConnection,
  getFacebookConnection,
  resolveMetaAccessTokenForUser,
  saveFacebookConnection,
} from "@/lib/facebook-connection";

export {
  getMetaAppCredentials,
  isFacebookOAuthConfigured,
  getFacebookConnection,
  resolveMetaAccessTokenForUser,
};

/** Meta Graph API base (keep in sync with Ads Library calls). */
const GRAPH = "https://graph.facebook.com/v21.0";
const OAUTH_SCOPES = ["public_profile", "email", "pages_show_list"].join(",");

export function facebookOAuthRedirectUri(baseUrl?: string) {
  const base = (baseUrl || appBaseUrl()).replace(/\/$/, "");
  return `${base}/api/integrations/facebook/callback`;
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

export function buildFacebookOAuthUrl(opts: {
  userId: string;
  /** Prefer the live request origin so local :3001 matches the browser. */
  baseUrl?: string;
}) {
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
  url.searchParams.set("redirect_uri", facebookOAuthRedirectUri(opts.baseUrl));
  url.searchParams.set("state", signState(payload));
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export function parseFacebookOAuthState(state: string) {
  return verifyState(state);
}

async function exchangeCodeForToken(opts: { code: string; baseUrl?: string }) {
  const { appId, appSecret } = getMetaAppCredentials();
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", facebookOAuthRedirectUri(opts.baseUrl));
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
  await clearFacebookConnection(userId);
}

export async function completeFacebookOAuth(opts: {
  userId: string;
  code: string;
  state: string;
  baseUrl?: string;
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
    baseUrl: opts.baseUrl,
  });
  const longLived = await exchangeLongLivedToken(short.access_token!);
  const profile = await fetchFacebookProfile(longLived.access_token!);

  const expiresAt = longLived.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000)
    : null;

  try {
    await saveFacebookConnection({
      userId: opts.userId,
      facebookUserId: profile.id,
      facebookName: profile.name,
      facebookPictureUrl: profile.pictureUrl,
      accessToken: longLived.access_token!,
      expiresAt,
    });
  } catch (err) {
    console.error("[facebook] failed to save connection", err);
    throw new Error(
      "Connected to Facebook but could not save your profile. Try again in a moment.",
    );
  }

  return profile;
}
