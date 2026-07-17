const HOME_KEY = "leadflow:home-search";
const FINDER_KEY = "leadflow:finder-search";

export type SearchSessionLead = {
  id: string;
  businessName: string;
  address: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  leadScore: number;
  qualityTier: string | null;
  industry?: string | null;
  serviceCategory?: string | null;
  city: string | null;
  state: string | null;
  zip?: string | null;
  outreachAngle?: string | null;
  revenueRangeEstimate?: string | null;
  yelpRating?: number | null;
  googleMapsLink?: string | null;
};

export type HomeSearchCache = {
  searchId?: string;
  leads: SearchSessionLead[];
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state?: string;
  city: string;
  customLocation?: string;
  zip: string;
  radius?: string;
  messages?: Array<{ id: string; role: "user" | "assistant"; text: string }>;
  savedAt: number;
};

export type FinderSearchCache = {
  searchId?: string;
  leads: SearchSessionLead[];
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state?: string;
  city: string;
  customLocation?: string;
  zip: string;
  radius?: string;
  selectedLeadIds: string[];
  savedAt: number;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function loadHomeSearchCache(): HomeSearchCache | null {
  return readJson<HomeSearchCache>(HOME_KEY);
}

export function saveHomeSearchCache(cache: Omit<HomeSearchCache, "savedAt">) {
  writeJson(HOME_KEY, { ...cache, savedAt: Date.now() });
}

export function loadFinderSearchCache(): FinderSearchCache | null {
  return readJson<FinderSearchCache>(FINDER_KEY);
}

export function saveFinderSearchCache(cache: Omit<FinderSearchCache, "savedAt">) {
  writeJson(FINDER_KEY, { ...cache, savedAt: Date.now() });
}
