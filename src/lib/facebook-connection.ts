import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto-secret";
import { isFacebookOAuthConfigured } from "@/lib/facebook-oauth-config";

const facebookSelect = {
  facebookUserId: true,
  facebookName: true,
  facebookPictureUrl: true,
  facebookTokenExpiresAt: true,
  facebookConnectedAt: true,
  facebookAccessTokenEnc: true,
} as const satisfies Prisma.UserSelect;

export async function clearFacebookConnection(userId: string) {
  const data: Prisma.UserUpdateInput = {
    facebookUserId: null,
    facebookName: null,
    facebookPictureUrl: null,
    facebookAccessTokenEnc: null,
    facebookTokenExpiresAt: null,
    facebookConnectedAt: null,
  };
  await prisma.user.update({ where: { id: userId }, data });
}

export async function saveFacebookConnection(opts: {
  userId: string;
  facebookUserId: string;
  facebookName: string | null;
  facebookPictureUrl: string | null;
  accessToken: string;
  expiresAt: Date | null;
}) {
  const data: Prisma.UserUpdateInput = {
    facebookUserId: opts.facebookUserId,
    facebookName: opts.facebookName,
    facebookPictureUrl: opts.facebookPictureUrl,
    facebookAccessTokenEnc: encryptSecret(opts.accessToken),
    facebookTokenExpiresAt: opts.expiresAt,
    facebookConnectedAt: new Date(),
  };
  await prisma.user.update({ where: { id: opts.userId }, data });
}

export async function getFacebookConnection(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: facebookSelect,
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
      } as const satisfies Prisma.UserSelect,
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
  if (appId && appSecret) return `${appId}|${appSecret}`;
  return null;
}
