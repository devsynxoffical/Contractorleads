import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { appBaseUrl } from "@/lib/email-brand";
import {
  buildFacebookOAuthUrl,
  isFacebookOAuthConfigured,
} from "@/lib/facebook-oauth";

export async function GET() {
  const base = appBaseUrl();
  const user = await getSessionUser();
  if (!user) {
    const login = new URL("/login", base);
    login.searchParams.set("next", "/facebook");
    return NextResponse.redirect(login);
  }

  if (!isFacebookOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/facebook?error=oauth_not_configured", base),
    );
  }

  try {
    const url = buildFacebookOAuthUrl({ userId: user.id });
    return NextResponse.redirect(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start Facebook login";
    return NextResponse.redirect(
      new URL(`/facebook?error=${encodeURIComponent(message)}`, base),
    );
  }
}
