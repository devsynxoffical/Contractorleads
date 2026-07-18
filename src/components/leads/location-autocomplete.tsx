"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineMapPin } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type Suggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export function LocationAutocomplete({
  value,
  onChange,
  country = "US",
  name = "customLocation",
  placeholder = "City, county, or region",
  className,
  inputClassName,
  disabled,
}: {
  value: string;
  onChange: (value: string, suggestion?: Suggestion) => void;
  country?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`
        );
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, country]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <HiOutlineMapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          name={name}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "saas-input w-full pl-9",
            inputClassName
          )}
        />
      </div>
      {open && (suggestions.length > 0 || loading) && (
        <ul className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[var(--shadow-elevated)]">
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-[12px] text-ink-muted">
              Searching locations…
            </li>
          )}
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-brand-50"
                onClick={() => {
                  onChange(s.description, s);
                  setOpen(false);
                  setSuggestions([]);
                }}
              >
                <span className="text-[13px] font-medium text-ink">
                  {s.mainText}
                </span>
                {s.secondaryText && (
                  <span className="text-[11px] text-ink-muted">
                    {s.secondaryText}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
