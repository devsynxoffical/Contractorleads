import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SegmentsDashboard } from "@/components/segments/segments-dashboard";

export const metadata = {
  title: "Lead Lists & Segments | Contractor Leads",
  description: "Organize, filter, and manage contractor lead lists and launch multi-hook outreach campaigns.",
};

export default async function SegmentsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SegmentsDashboard />
    </div>
  );
}
