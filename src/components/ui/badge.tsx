import { cn } from "@/lib/utils";

const variants = {
  default: "bg-stone-100 text-ink-muted",
  hot: "bg-red-50 text-red-700 ring-1 ring-red-100",
  warm: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  nurture: "bg-sky-50 text-sky-800 ring-1 ring-sky-100",
  verified: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
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
        className
      )}
      {...props}
    />
  );
}
