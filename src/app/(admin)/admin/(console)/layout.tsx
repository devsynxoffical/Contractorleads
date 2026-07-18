import { redirect } from "next/navigation";
import { requireAdminStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { ensureRoleTemplates } from "@/lib/admin-permissions";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminStaff();
  if (!admin) redirect("/admin/login");

  await ensureRoleTemplates();

  return <AdminShell user={admin}>{children}</AdminShell>;
}
