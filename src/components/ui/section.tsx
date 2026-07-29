import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-ink sm:text-lg">
          {title}
        </h2>
        {description && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-ink-muted sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PromptCard({
  icon: Icon,
  title,
  description,
  onClick,
  delayIndex = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  delayIndex?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover-lift animate-fade-up group flex w-full flex-col rounded-2xl border border-[color:var(--border-strong)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-card)] sm:p-5"
      style={{ animationDelay: `${delayIndex * 0.05}s` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
        <Icon className="h-4 w-4" />
      </span>
      <span className="mt-3.5 text-sm font-semibold text-ink">{title}</span>
      <span className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
        {description}
      </span>
    </button>
  );
}

export function StatChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--panel-solid)] px-4 py-3.5 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-ink">{value}</p>
      {hint && (
        <p className="mt-1 text-[12px] leading-snug text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
