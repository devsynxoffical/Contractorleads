import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-[#122033] dark:text-[color:var(--ink-muted)] dark:ring-brand-500/15",
  hot: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
  warm: "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
  nurture:
    "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30",
  verified:
    "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  brand:
    "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200 dark:bg-brand-500/12 dark:text-brand-400 dark:ring-brand-500/25",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
