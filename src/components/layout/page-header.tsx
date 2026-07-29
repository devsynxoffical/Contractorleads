import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackLink, PageCrumbs, type Crumb } from "@/components/layout/back-nav";

/** Logo pink → magenta → purple. Prefer CSS var so light/dark stay in sync. */
const LOGO_GRADIENT = "var(--logo-gradient)";

export function PageHeader({
  eyebrow = "Contractor Leads",
  title,
  description,
  actions,
  className,
  backHref,
  backLabel = "Back",
  crumbs,
}: {
  eyebrow?: string | null;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  /** Show a back link above the title */
  backHref?: string;
  backLabel?: string;
  /** Optional breadcrumb trail under the back link */
  crumbs?: Crumb[];
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {(backHref || (crumbs && crumbs.length > 0)) && (
          <div className="mb-3 space-y-2">
            {backHref ? (
              <BackLink href={backHref} label={backLabel} />
            ) : null}
            {crumbs && crumbs.length > 0 ? <PageCrumbs items={crumbs} /> : null}
          </div>
        )}
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]",
            eyebrow ? "mt-1.5" : "mt-0",
          )}
        >
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
      className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white shadow-[0_6px_18px_var(--brand-glow)] transition hover:opacity-95"
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
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-[13px] font-medium text-ink-muted shadow-[var(--shadow-soft)] backdrop-blur transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
    >
      {children}
    </Link>
  );
}

export { LOGO_GRADIENT };
export type { Crumb };
