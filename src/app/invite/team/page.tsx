import { Suspense } from "react";
import { TeamAcceptClient } from "@/components/team/team-accept-client";

export const metadata = {
  title: "Team invite · Contractor Leads",
  robots: { index: false, follow: false },
};

export default function PublicTeamInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas,#f6f4f9)] px-4 py-10">
      <Suspense
        fallback={
          <p className="text-[13px] text-ink-muted">Loading invite…</p>
        }
      >
        <TeamAcceptClient />
      </Suspense>
    </div>
  );
}
