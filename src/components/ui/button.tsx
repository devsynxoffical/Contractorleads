import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-[0_4px_14px_rgba(123,31,162,0.28)] hover:opacity-95 hover:shadow-[0_6px_20px_rgba(123,31,162,0.34)] [background:linear-gradient(135deg,#e6007e_0%,#8e24aa_55%,#7b1fa2_100%)]",
        secondary:
          "border border-border bg-white text-ink shadow-[var(--shadow-soft)] hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-700",
        ghost:
          "text-ink-muted hover:bg-brand-50/80 hover:text-brand-700",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
