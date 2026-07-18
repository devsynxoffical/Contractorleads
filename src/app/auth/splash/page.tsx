import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthSplashClient from "./splash-client";

export default async function AuthSplashPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AuthSplashClient />;
}
