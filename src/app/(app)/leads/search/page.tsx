import { Suspense } from "react";
import { LeadSearchForm } from "@/components/leads/lead-search-form";

export default function LeadSearchPage() {
  return (
    <Suspense fallback={<div className="page-pad text-sm text-ink-muted">Loading Lead Finder…</div>}>
      <LeadSearchForm />
    </Suspense>
  );
}
