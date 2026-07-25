import type { Metadata } from "next";

/** Auth and legal routes under (auth) — private flows stay noindex by default. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
