import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-[#faf8fc] px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition hover:border-[#d4cedc] focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  );
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
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-border bg-[#faf8fc] px-3.5 text-sm text-ink outline-none transition hover:border-[#d4cedc] focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-[var(--ring)]",
        className
      )}
      {...props}
    >
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
        "flex min-h-[120px] w-full rounded-xl border border-border bg-[#faf8fc] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition hover:border-[#d4cedc] focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  );
});
