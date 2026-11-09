import { SEO_REGIONS, TRADE_PAGES } from "@/lib/seo";
import { getStateProfile, topCitiesForState, type StateProfile } from "@/lib/state-profiles";

/**
 * Location pages (/locations/[state]): "find contractor leads in [state]".
 *
 * Built only from the documented state facts in state-profiles.ts (Census division,
 * climate exposures, solar resource, growth, housing age, neighbours, largest cities).
 * Each state gets its own ranked list of trades to prospect, with reasons that follow
 * from its facts, so pages differ in substance and not only in the state name.
 * No counts, offices or results are claimed.
 */

type PriorityTrade = "roofing" | "hvac" | "plumbing" | "electrical" | "solar" | "general-contractors" | "remodeling";

export type TradeFit = { slug: PriorityTrade; name: string; score: number; reasons: string[] };

const has = (p: StateProfile, e: StateProfile["exposures"][number]) => p.exposures.includes(e);

/** Score each priority trade by how strongly the state's facts create demand for it. */
export function rankTrades(p: StateProfile): TradeFit[] {
  const fits: TradeFit[] = [];
  const add = (slug: PriorityTrade, parts: Array<[boolean, number, string]>, base: string) => {
    const hits = parts.filter(([ok]) => ok);
    const name = TRADE_PAGES.find((t) => t.slug === slug)?.name ?? slug;
    fits.push({ slug, name, score: hits.reduce((a, [, w]) => a + w, 0), reasons: hits.length ? hits.map(([, , r]) => r) : [base] });
  };
  add("roofing", [
    [has(p, "hail"), 3, "hail-belt storms drive insurance roof replacements"],
    [has(p, "hurricane"), 3, "hurricane season brings wind damage and re-roofing"],
    [has(p, "tornado"), 2, "tornado and severe-storm damage creates urgent repairs"],
    [has(p, "coastal-storms"), 2, "nor'easters and coastal storms keep repair work steady"],
    [has(p, "cold-winters"), 1, "snow load and ice dams cause winter repairs"],
    [has(p, "wildfire"), 1, "fire-rated roofing is a selling point in wildfire areas"],
  ], "roof replacements follow the age of local housing");
  add("hvac", [
    [has(p, "long-heat"), 3, "a long cooling season makes AC repair and replacement the core business"],
    [has(p, "cold-winters"), 3, "cold winters make heating service and no-heat emergencies essential"],
    [has(p, "wildfire"), 1, "wildfire smoke raises demand for air filtration"],
    [has(p, "hurricane"), 1, "humidity and storms add dehumidification and post-storm checks"],
  ], "a mixed climate suits heat pumps and twice-yearly maintenance plans");
  add("plumbing", [
    [has(p, "cold-winters"), 3, "freezing temperatures cause frozen and burst pipes"],
    [p.olderHousing, 2, "older housing needs repiping and drain work"],
    [has(p, "hurricane") || has(p, "coastal-storms"), 1, "storm flooding drives sump pump and water-damage work"],
    [p.fastGrowing, 1, "fast population growth adds new homeowners without a plumber"],
  ], "steady year-round emergency and replacement demand");
  add("electrical", [
    [has(p, "hurricane") || has(p, "coastal-storms") || has(p, "tornado") || has(p, "cold-winters"), 2, "storm and winter outages drive generator and panel work"],
    [has(p, "wildfire"), 2, "wildfire power shutoffs raise interest in backup power"],
    [p.olderHousing, 2, "older homes need panel and wiring upgrades"],
    [has(p, "long-heat"), 1, "heavy AC loads push panel upgrades"],
  ], "EV chargers and panel upgrades keep demand steady");
  add("solar", [
    [p.solar === "strong", 4, "strong year-round sun makes solar an easy sell"],
    [p.solar === "good", 2, "good sun supports a solid residential solar market"],
    [has(p, "long-heat"), 1, "high summer cooling bills strengthen the solar pitch"],
    [has(p, "hurricane") || has(p, "wildfire"), 1, "outages add interest in battery backup"],
  ], "solar sells on bill savings and battery backup despite less sun");
  add("general-contractors", [
    [p.fastGrowing, 3, "fast population growth means new construction and additions"],
    [has(p, "hurricane"), 1, "storm rebuilds create large restoration projects"],
    [p.olderHousing, 1, "older buildings need major renovations"],
  ], "steady renovation and commercial build-out work");
  add("remodeling", [
    [p.olderHousing, 3, "older housing stock drives kitchen, bath and whole-home remodels"],
    [p.fastGrowing, 1, "new arrivals renovate the homes they buy"],
  ], "kitchen and bath remodels follow home sales and housing age");
  return fits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

const EXPOSURE_TEXT: Record<StateProfile["exposures"][number], string> = {
  hail: "hail",
  hurricane: "hurricanes",
  "coastal-storms": "coastal storms",
  tornado: "tornadoes",
  wildfire: "wildfire",
  "cold-winters": "cold winters",
  "long-heat": "long, hot summers",
};

function listText(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export type LocationPage = {
  slug: string;
  name: string;
  code: string;
  profile: StateProfile;
  cities: string[];
  trades: TradeFit[];
  neighbours: Array<{ slug: string; name: string }>;
  sameDivision: Array<{ slug: string; name: string }>;
  exposures: string[];
  quickAnswer: { q: string; a: string };
  intro: string;
  marketFacts: Array<{ label: string; value: string }>;
  timing: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const LOCATION_STATES = SEO_REGIONS;

export function getLocation(slug: string): LocationPage | null {
  const region = SEO_REGIONS.find((r) => r.slug === slug);
  if (!region) return null;
  const profile = getStateProfile(region.code);
  if (!profile) return null;
  const cities = topCitiesForState(region.code);
  const trades = rankTrades(profile);
  const top3 = trades.slice(0, 3);
  const exposures = profile.exposures.map((e) => EXPOSURE_TEXT[e]);
  const byCode = (code: string) => SEO_REGIONS.find((r) => r.code === code);
  const neighbours = profile.neighbours.map(byCode).filter(Boolean).map((r) => ({ slug: r!.slug, name: r!.name }));
  const sameDivision = SEO_REGIONS.filter(
    (r) => r.code !== region.code && getStateProfile(r.code)?.division === profile.division && !profile.neighbours.includes(r.code),
  ).map((r) => ({ slug: r.slug, name: r.name }));
  const n = region.name;
  const lowerTop = top3.map((t) => t.name.toLowerCase().replace(/\bhvac\b/g, "HVAC"));
  const cityText = listText(cities.slice(0, 3));

  const timing: string[] = [];
  if (has(profile, "hail") || has(profile, "tornado")) timing.push("Late winter, before spring storm season, is the best time to pitch roofers and storm-restoration companies.");
  if (has(profile, "hurricane")) timing.push("Spring, before hurricane season starts on June 1, is the window for storm-ready marketing offers.");
  if (has(profile, "long-heat")) timing.push("Pitch HVAC companies in late winter and early spring, before the first heat wave fills their schedules.");
  if (has(profile, "cold-winters")) timing.push("Pitch heating and plumbing companies in late summer and early autumn, before freeze season.");
  if (!timing.length) timing.push("Demand is spread across the year, so steady monthly outreach works better than seasonal pushes.");

  return {
    slug: region.slug,
    name: n,
    code: region.code,
    profile,
    cities,
    trades,
    neighbours,
    sameDivision,
    exposures,
    quickAnswer: {
      q: `How do I find contractor leads in ${n}?`,
      a: `Search live Google data for contractors in ${n}, starting with ${cityText}. In ${n} the strongest trades to prospect are ${listText(lowerTop)}. Contractor Leads adds owner names, verified emails and AI marketing scores to every business, and your first 10 leads are free.`,
    },
    intro: `Contractor Leads helps marketing agencies, suppliers and sales teams find contractor leads in ${n}: roofers, HVAC companies, plumbers, electricians and 14 more trades, pulled from live Google data with owner names and verified emails. Search any ${n} city, county or radius. Plans start at $19.99 a month for 500 leads, and the first 10 are free.`,
    marketFacts: [
      { label: "Census division", value: profile.division },
      { label: "Weather that drives contractor work", value: exposures.length ? listText(exposures) : "no single dominant weather risk" },
      { label: "Solar resource", value: profile.solar === "strong" ? "Strong" : profile.solar === "good" ? "Good" : "Lower" },
      { label: "Population growth", value: profile.fastGrowing ? "Among the faster-growing states" : "Moderate" },
      { label: "Housing stock", value: profile.olderHousing ? "Much of it is older" : "Mixed ages" },
    ],
    timing,
    faqs: [
      {
        q: `Which contractors are best to prospect in ${n}?`,
        a: `Based on ${n}'s weather and housing, ${listText(lowerTop)} have the strongest demand: ${top3[0].reasons[0]}${top3[1] ? `, and ${top3[1].reasons[0]}` : ""}. Those owners feel the busy seasons most, which makes marketing offers easy to explain.`,
      },
      {
        q: `When is the best time to contact contractors in ${n}?`,
        a: `${timing.slice(0, 2).join(" ")} Avoid long sales calls in the middle of a busy season or right after a storm, when owners are on job sites.`,
      },
      {
        q: `Which ${n} cities should I search first?`,
        a: `Start with the largest metros, ${listText(cities.slice(0, 3))}, where there are the most contractors to compare. Smaller cities such as ${listText(cities.slice(3, 5)) || "nearby towns"} usually have less agency competition and owners who are easier to reach.`,
      },
      {
        q: `How do I find the owner of a contracting business in ${n}?`,
        a: `Contractor Leads adds owner names from company websites and public sources where they can be confirmed. To double-check, use the ${n} contractor license lookup where the trade is licensed, the secretary of state business filing, or owner replies to Google reviews.`,
      },
      {
        q: `How much does it cost to find contractor leads in ${n}?`,
        a: `The first 10 leads are free with no credit card. Paid plans start at $19.99 a month for 500 credits, where one credit is one lead with owner name, verified email and AI scores, and larger plans lower the cost per lead.`,
      },
    ],
  };
}
