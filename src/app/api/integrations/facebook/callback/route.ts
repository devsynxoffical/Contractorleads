import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { appBaseUrl } from "@/lib/email-brand";
import {
  completeFacebookOAuth,
  parseFacebookOAuthState,
} from "@/lib/facebook-oauth";

function redirectToFacebook(query: Record<string, string>) {
  const url = new URL("/facebook", appBaseUrl());
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");

  if (oauthError) {
    return redirectToFacebook({
      error: oauthErrorDesc || oauthError || "Facebook login was cancelled",
    });
  }

  if (!code || !state) {
    return redirectToFacebook({ error: "Missing Facebook OAuth code" });
  }

  const user = await getSessionUser();
  if (!user) {
    const login = new URL("/login", appBaseUrl());
    login.searchParams.set("next", "/facebook");
    return NextResponse.redirect(login);
  }

  const parsed = parseFacebookOAuthState(state);
  if (!parsed || parsed.userId !== user.id) {
    return redirectToFacebook({
      error: "Facebook login state did not match your session. Try again.",
    });
  }

  try {
    await completeFacebookOAuth({
      userId: user.id,
      code,
      state,
    });
    return redirectToFacebook({ connected: "1" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Facebook connection failed";
    return redirectToFacebook({ error: message });
  }
}
