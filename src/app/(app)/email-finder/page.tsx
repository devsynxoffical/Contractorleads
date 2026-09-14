import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { EmailFinderView } from "@/components/email/email-finder-view";
import { HiOutlineShieldCheck, HiOutlineEnvelope } from "react-icons/hi2";

export const metadata = {
  title: "Bulk Email Finder | Contractor Leads",
  description: "Find verified business emails, owners, and decision-makers from contractor websites and domains.",
};

export default async function EmailFinderPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Email Finder"
        description="Extract verified emails, owners, and contact details from company domains in bulk. 100% free and unlimited for all users."
        backHref="/inbox"
        backLabel="Back to Email Workspace"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Email", href: "/inbox" },
          { label: "Email Finder" },
        ]}
        actions={
          <>
            <SecondaryActionLink href="/email-verifier">
              <HiOutlineShieldCheck className="h-4 w-4" />
              Email Verifier
            </SecondaryActionLink>
            <PrimaryActionLink href="/inbox?tab=bulk">
              <HiOutlineEnvelope className="h-4 w-4" />
              Send Bulk Email
            </PrimaryActionLink>
          </>
        }
      />

      <EmailFinderView />
    </div>
  );
}
