/** Shared Meta app credential helpers (no Prisma — safe for client-adjacent imports). */

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
