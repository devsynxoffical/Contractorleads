import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_GRADIENT =
  "linear-gradient(135deg, #00e5ff 0%, #00b8d4 55%, #0097a7 100%)";

export function PageHeader({
  eyebrow = "LeadFlow USA",
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function PrimaryActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(123,31,162,0.28)] transition hover:opacity-95"
      style={{ background: LOGO_GRADIENT }}
    >
      {children}
    </Link>
  );
}

export function SecondaryActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white/90 px-3.5 text-[13px] font-medium text-ink-muted shadow-[var(--shadow-soft)] backdrop-blur transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
    >
      {children}
    </Link>
  );
}

export { LOGO_GRADIENT };
