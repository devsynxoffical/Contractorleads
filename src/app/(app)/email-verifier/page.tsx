import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  PageHeader,
  PrimaryActionLink,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { EmailVerifierView } from "@/components/email/email-verifier-view";
import { HiOutlineEnvelope, HiOutlineUsers } from "react-icons/hi2";

export const metadata = {
  title: "Email Verifier | Contractor Leads",
  description: "Verify email deliverability, check MX records, detect disposable emails, and validate mailbox existence in real-time.",
};

export default async function EmailVerifierPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Email Verifier"
        description="Verify any email address or batch-verify contact lists before cold emailing. 100% free and unlimited for all users."
        backHref="/inbox"
        backLabel="Back to Email Workspace"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Email", href: "/inbox" },
          { label: "Email Verifier" },
        ]}
        actions={
          <>
            <SecondaryActionLink href="/leads/saved">
              <HiOutlineUsers className="h-4 w-4" />
              Saved Leads
            </SecondaryActionLink>
            <PrimaryActionLink href="/inbox?tab=bulk">
              <HiOutlineEnvelope className="h-4 w-4" />
              Bulk Email
            </PrimaryActionLink>
          </>
        }
      />

      <EmailVerifierView />
    </div>
  );
}
