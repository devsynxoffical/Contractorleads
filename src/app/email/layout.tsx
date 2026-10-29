import type { Metadata } from "next";

/** Token-driven email preference and unsubscribe pages: never index. */
export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

export default function EmailUtilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
