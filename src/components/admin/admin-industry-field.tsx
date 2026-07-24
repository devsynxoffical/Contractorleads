"use client";

import { INDUSTRIES } from "@/lib/constants";
import { CUSTOM_INDUSTRY_VALUE } from "@/lib/search-criteria";

export { CUSTOM_INDUSTRY_VALUE };

export type AdminIndustryFieldProps = {
  label?: string;
  /** Preset industry, `CUSTOM_INDUSTRY_VALUE`, or `""` when `allowEmpty` */
  selectValue: string;
  customValue: string;
  onSelectChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  /**
   * Extra niches already in the pool (e.g. custom scrapes like "Agency owners").
   * Shown under “Scraped niches” so admins can pick them again.
   */
  knownNiches?: string[];
};

export function resolvedIndustryForQuery(
  selectValue: string,
  customValue: string,
): string {
  if (!selectValue) return "";
  if (selectValue === CUSTOM_INDUSTRY_VALUE) return customValue.trim();
  return selectValue;
}

/** Body fields for APIs that use `resolveSearchCriteria`. */
export function industryPayloadForApi(selectValue: string, customValue: string) {
  if (selectValue === CUSTOM_INDUSTRY_VALUE) {
    return {
      industry: CUSTOM_INDUSTRY_VALUE,
      customIndustry: customValue.trim(),
    };
  }
  return { industry: selectValue };
}

export function AdminIndustryField({
  label = "Service / niche",
  selectValue,
  customValue,
  onSelectChange,
  onCustomChange,
  allowEmpty = false,
  emptyLabel = "All services",
  className,
  knownNiches = [],
}: AdminIndustryFieldProps) {
  const isCustom = selectValue === CUSTOM_INDUSTRY_VALUE;
  const presetSet = new Set<string>(INDUSTRIES);
  const scrapedNiches = Array.from(
    new Set(
      knownNiches
        .map((n) => n.trim())
        .filter((n) => n && !presetSet.has(n)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  // Keep a selected scraped niche visible even if not yet in knownNiches
  const selectOptionsIncludeValue =
    !selectValue ||
    selectValue === CUSTOM_INDUSTRY_VALUE ||
    presetSet.has(selectValue) ||
    scrapedNiches.includes(selectValue);

  return (
    <div className={className}>
      <label className="block text-[12px]">
        <span className="font-medium text-ink-muted">{label}</span>
        <select
          className="saas-input mt-1"
          value={selectValue}
          onChange={(e) => onSelectChange(e.target.value)}
        >
          {allowEmpty && <option value="">{emptyLabel}</option>}
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
          {scrapedNiches.length > 0 && (
            <optgroup label="Scraped niches">
              {scrapedNiches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </optgroup>
          )}
          {!selectOptionsIncludeValue && selectValue && (
            <option value={selectValue}>{selectValue}</option>
          )}
          <option value={CUSTOM_INDUSTRY_VALUE}>Custom service…</option>
        </select>
      </label>
      {isCustom && (
        <label className="mt-2 block text-[12px]">
          <span className="font-medium text-ink-muted">Custom service name</span>
          <input
            className="saas-input mt-1"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="e.g. Window tinting, Agency owners"
            required
          />
        </label>
      )}
    </div>
  );
}
