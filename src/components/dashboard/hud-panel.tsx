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
    <div className={cn("hud-panel", className)}>
      <span className="hud-bracket hud-bracket-tl" aria-hidden />
      <span className="hud-bracket hud-bracket-tr" aria-hidden />
      <span className="hud-bracket hud-bracket-bl" aria-hidden />
      <span className="hud-bracket hud-bracket-br" aria-hidden />
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-brand-400">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-[#7a8899]">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
