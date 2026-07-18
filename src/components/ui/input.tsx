import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-11 w-full rounded-xl border border-[#00e5ff]/25 bg-[#070d18]/90 px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition hover:border-[#00e5ff]/40 focus:border-[#00e5ff]/55 focus:bg-[#0a1422] focus:ring-4 focus:ring-[var(--ring)]";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border border-[#00e5ff]/25 bg-[#070d18]/90 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition hover:border-[#00e5ff]/40 focus:border-[#00e5ff]/55 focus:bg-[#0a1422] focus:ring-4 focus:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  );
});
