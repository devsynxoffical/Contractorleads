"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmailInboxPanel } from "@/components/email/email-inbox-panel";
import { EmailMetricsDashboard } from "@/components/email/email-metrics-dashboard";

export default function InboxPage() {
  return (
    <div className="page-pad space-y-8">
      <PageHeader
        title="Email inbox"
        description="Read replies from leads and respond from your connected SMTP mailbox. Metrics for delivered, received, and failed sends are below."
      />

      <EmailInboxPanel />

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-[17px] font-semibold text-ink">Email activity</h2>
        <EmailMetricsDashboard
          endpoint="/api/emails/stats"
          leadHref={(id) => `/leads/${id}?from=saved`}
        />
      </section>
    </div>
  );
}
