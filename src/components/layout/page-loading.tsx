export function PageLoadingFallback({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-pad animate-fade-in">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-brand-500/20" />
        <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-[#122033]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#0f1a2c]" />
      </div>
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl border border-brand-500/15 bg-[rgba(12,22,38,0.85)]" />
        <div className="h-28 animate-pulse rounded-2xl border border-brand-500/12 bg-[rgba(12,22,38,0.75)]" />
        <div className="h-28 animate-pulse rounded-2xl border border-brand-500/10 bg-[rgba(12,22,38,0.65)]" />
      </div>
      <p className="mt-6 text-center text-[13px] font-medium text-[#8b9aab]">
        {label}
      </p>
    </div>
  );
}
