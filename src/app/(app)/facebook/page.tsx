import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { FacebookHubView } from "@/components/facebook/facebook-hub-view";

export default async function FacebookPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <Suspense
      fallback={
        <div className="page-pad text-[13px] text-ink-muted">Loading Facebook…</div>
      }
    >
      <FacebookHubView />
    </Suspense>
  );
}
