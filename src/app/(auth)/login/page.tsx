import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign in to Contractor Leads",
  description:
    "Sign in to your Contractor Leads account to search verified contractor leads, run outreach, and manage your pipeline.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <AuthPage initialMode="login" />;
}
