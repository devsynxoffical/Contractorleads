import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { appBaseUrl } from "@/lib/email-brand";
import {
  buildFacebookOAuthUrl,
  isFacebookOAuthConfigured,
} from "@/lib/facebook-oauth";

function requestBase(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return appBaseUrl();
  }
}

export async function GET(request: Request) {
  const base = requestBase(request);
  const user = await getSessionUser();
  if (!user) {
    const login = new URL("/login", base);
    login.searchParams.set("next", "/facebook");
    return NextResponse.redirect(login);
  }

  if (!isFacebookOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/facebook?error=connect_unavailable", base),
    );
  }

  try {
    const url = buildFacebookOAuthUrl({ userId: user.id, baseUrl: base });
    return NextResponse.redirect(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start Facebook login";
    return NextResponse.redirect(
      new URL(`/facebook?error=${encodeURIComponent(message)}`, base),
    );
  }
}
