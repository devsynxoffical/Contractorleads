import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthSplashClient from "./splash-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthSplashPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AuthSplashClient />;
}
