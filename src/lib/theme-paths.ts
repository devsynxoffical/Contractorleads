/** Paths that must always render in light mode (marketing, auth, etc.). */
export function isPublicLightPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  const prefixes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/onboarding",
    "/auth",
    "/email",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
