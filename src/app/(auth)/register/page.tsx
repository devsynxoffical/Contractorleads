import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Start free — verified contractor leads for agencies",
  description:
    "Create your Contractor Leads account. Free trial credits, no card required. Find AI-scored home-service contractor prospects in minutes.",
  path: "/register",
});

export default function RegisterPage() {
  return <AuthPage initialMode="register" />;
}
