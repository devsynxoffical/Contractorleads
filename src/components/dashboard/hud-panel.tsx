import { cn } from "@/lib/utils";

/** HUD-style panel with cyan L-bracket corners (SeanTheme-inspired). */
export function HudPanel({
  children,
  className,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn("hud-panel font-[family-name:var(--font-jakarta)]", className)}>
      <span className="hud-bracket hud-bracket-tl" aria-hidden />
      <span className="hud-bracket hud-bracket-tr" aria-hidden />
      <span className="hud-bracket hud-bracket-bl" aria-hidden />
      <span className="hud-bracket hud-bracket-br" aria-hidden />
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 font-[family-name:var(--font-jakarta)] text-[12px] leading-snug text-ink-muted">
                {subtitle}
              </p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
