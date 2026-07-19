export function PageLoadingFallback({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-pad animate-fade-in">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-brand-500/20" />
        <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-[var(--input-bg)]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[var(--input-bg)]" />
      </div>
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-[var(--panel-solid)]" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-[var(--panel-solid)]" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-[var(--panel-solid)]" />
      </div>
      <p className="mt-6 text-center text-[13px] font-medium text-ink-muted">
        {label}
      </p>
    </div>
  );
}
