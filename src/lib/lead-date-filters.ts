export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfDaysAgo(days: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}

/** Client-side date window check (today, yesterday, last N days). */
export function matchesWhenFilter(date: Date | string, when: string): boolean {
  if (!when || when === "all") return true;

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return false;

  const today = startOfToday();

  if (when === "today") {
    return value >= today;
  }

  if (when === "yesterday") {
    const yesterdayStart = startOfDaysAgo(1);
    return value >= yesterdayStart && value < today;
  }

  if (when === "week") {
    return value >= startOfDaysAgo(7);
  }

  if (when === "month") {
    return value >= startOfDaysAgo(30);
  }

  if (when === "90days") {
    return value >= startOfDaysAgo(90);
  }

  return true;
}

export const LEAD_WHEN_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "90days", label: "Last 90 days" },
] as const;

export const LEAD_TIER_FILTERS = [
  { value: "all", label: "All tiers" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "nurture", label: "Nurture" },
] as const;

export const LEAD_STRENGTH_FILTERS = [
  { value: "all", label: "Any score" },
  { value: "strong", label: "Strong (75+)" },
  { value: "medium", label: "Medium (50–74)" },
  { value: "developing", label: "Developing (<50)" },
] as const;

export function matchesStrengthFilter(score: number, strength: string): boolean {
  if (!strength || strength === "all") return true;
  if (strength === "strong") return score >= 75;
  if (strength === "medium") return score >= 50 && score < 75;
  if (strength === "developing") return score < 50;
  return true;
}

export function matchesTierFilter(tier: string | null | undefined, filter: string): boolean {
  if (!filter || filter === "all") return true;
  return (tier ?? "nurture").toLowerCase() === filter.toLowerCase();
}
