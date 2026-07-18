import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login");

  return <AdminShell user={admin}>{children}</AdminShell>;
}
