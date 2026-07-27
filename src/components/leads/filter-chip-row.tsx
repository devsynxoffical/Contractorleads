"use client";

import { cn } from "@/lib/utils";

type Chip = { value: string; label: string };

export function FilterChipRow({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: readonly Chip[];
  value: string;
  onChange: (value: string) => void;
  tone?: "default" | "tier";
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {options.map((opt) => {
          const active = value === opt.value;
          const tierClass =
            tone === "tier" && active
              ? opt.value === "hot"
                ? "bg-orange-50 text-orange-800 ring-1 ring-orange-200"
                : opt.value === "warm"
                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                  : opt.value === "nurture"
                    ? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                    : "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
              : active
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                : "bg-[#faf8fb] text-ink-muted hover:text-ink";

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 py-2 text-[13px] font-semibold transition",
                tierClass,
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
