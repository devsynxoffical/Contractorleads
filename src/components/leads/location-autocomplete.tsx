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
  const [fetchError, setFetchError] = useState<string | null>(null);
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
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`
        );
        const data = (await res.json()) as {
          suggestions?: Suggestion[];
          error?: string;
        };
        if (!res.ok) {
          setSuggestions([]);
          setFetchError("Location suggestions are temporarily unavailable.");
          setOpen(false);
          return;
        }
        setSuggestions(data.suggestions ?? []);
        setFetchError(data.error ?? null);
        setOpen((data.suggestions?.length ?? 0) > 0 || Boolean(data.error));
      } catch {
        setSuggestions([]);
        setFetchError("Location suggestions are temporarily unavailable.");
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, country]);

  const showPanel =
    open && (loading || suggestions.length > 0 || Boolean(fetchError));

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <HiOutlineMapPin
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <input
          name={name}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || fetchError) setOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            inputClassName || "saas-input",
            "w-full !pl-9",
          )}
        />
      </div>
      {showPanel && (
        <ul
          className="absolute z-[60] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-[var(--surface)] py-1 shadow-[var(--shadow-elevated)]"
          role="listbox"
        >
          {loading && suggestions.length === 0 && !fetchError && (
            <li className="px-3 py-2 text-[12px] text-ink-muted">
              Searching locations…
            </li>
          )}
          {fetchError && (
            <li className="px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">
              {fetchError}
            </li>
          )}
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col items-start px-3 py-2 text-left transition hover:bg-brand-50 dark:hover:bg-brand-500/10"
                onClick={() => {
                  onChange(s.description, s);
                  setOpen(false);
                  setSuggestions([]);
                  setFetchError(null);
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
