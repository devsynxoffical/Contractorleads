import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[#122033] text-ink-muted ring-1 ring-[#00e5ff]/15",
  hot: "bg-red-500/15 text-red-300 ring-1 ring-red-400/30",
  warm: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  nurture: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30",
  verified: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  brand: "bg-[#00e5ff]/12 text-[#5eead4] ring-1 ring-[#00e5ff]/25",
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
