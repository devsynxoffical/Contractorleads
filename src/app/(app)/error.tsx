"use client";

import { ErrorState } from "@/components/layout/error-state";

export default function AppSegmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorState
      title="This page didn't load"
      description="The workspace is still signed in — retrying re-fetches just this section."
      error={error}
      retry={unstable_retry}
      homeHref="/home"
      homeLabel="Back to dashboard"
    />
  );
}
