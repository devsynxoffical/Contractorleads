import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { BulkEmailFinderView } from "@/components/leads/bulk-email-finder-view";
import { HiOutlineEnvelope, HiOutlineShieldCheck, HiOutlineUsers } from "react-icons/hi2";

export const metadata = {
  title: "Bulk Email Finder | Contractor Leads",
  description: "Find decision-maker verified emails, owner names, phone numbers, and social profiles for any contractor or business niche.",
};

export default async function BulkEmailFinderPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Bulk Email Finder"
        description="Scrape and discover verified contractor emails, owner names, phone numbers, and LinkedIn profiles in bulk."
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Leads", href: "/leads" },
          { label: "Bulk Email Finder" },
        ]}
        actions={
          <>
            <SecondaryActionLink href="/email-verifier">
              <HiOutlineShieldCheck className="h-4 w-4" />
              Email Verifier
            </SecondaryActionLink>
            <PrimaryActionLink href="/inbox?tab=bulk">
              <HiOutlineEnvelope className="h-4 w-4" />
              Bulk Email
            </PrimaryActionLink>
          </>
        }
      />

      <BulkEmailFinderView />
    </div>
  );
}
