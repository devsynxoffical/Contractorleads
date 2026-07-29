"use client";

import { ErrorState } from "@/components/layout/error-state";

export default function AdminSegmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorState
      title="The admin console hit an error"
      description="Retry to re-run this screen. If it keeps failing, the reference below matches the server log entry."
      error={error}
      retry={unstable_retry}
      homeHref="/home"
      homeLabel="Back to app"
    />
  );
}
