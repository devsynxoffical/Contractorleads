import type { StateProfile } from "@/lib/state-profiles";
import { getTradeHubContent } from "@/lib/trade-hub-content";

/**
 * Per-state pitch guidance for the trade+state pages: which searches to check for a
 * prospect (ordered by what the state's climate and housing make most relevant), a
 * city-by-search grid, and an example cold email opener. Built only from the coarse
 * state facts in state-profiles, so every statement stays true; no volumes are claimed.
 */
export type StatePitch = {
  /** Why these searches come first in this state (one sentence). */
  angle: string;
  /** Search terms ordered for this state. */
  terms: string[];
  /** Rows of [city, [search for that city × first terms]]. */
  grid: Array<{ city: string; searches: string[] }>;
  /** Example first lines of a cold email, with {{tokens}} left for personalisation. */
  opener: string;
};

type Angle = { lead: string[]; angle: string; hook: string };

function has(p: StateProfile, ...e: StateProfile["exposures"]) {
  return e.some((x) => p.exposures.includes(x));
}

function pickAngle(slug: string, state: string, p: StateProfile): Angle | null {
  switch (slug) {
    case "roofing":
      if (has(p, "hail", "hurricane", "tornado", "coastal-storms"))
        return {
          lead: ["storm damage roof repair", "roof inspection", "roof leak repair"],
          angle: `${state} sees severe weather, so storm, inspection and leak searches come first; they spike after each event and need a page and an ad ready before it happens.`,
          hook: "when the next storm comes through {{city}}, homeowners will search for storm damage roof repair and roof inspections. I checked, and {{company}} doesn't show up for either yet",
        };
      if (p.olderHousing)
        return {
          lead: ["roof replacement", "roof repair", "roof inspection"],
          angle: `Much of the housing in ${state} is older, so replacement and repair searches are steady all year; lead with those rather than storm work.`,
          hook: "a lot of homes around {{city}} are due a new roof, and people search for roof replacement before they ask for quotes. {{company}} isn't in those results yet",
        };
      return {
        lead: ["roof repair", "roof replacement", "roofing contractor"],
        angle: `In ${state}, repair and replacement searches are the core of a roofer's demand, so check those first.`,
        hook: "people in {{city}} searching for roof repair see three other roofers before {{company}}",
      };
    case "hvac":
      if (has(p, "long-heat"))
        return {
          lead: ["AC repair", "emergency AC repair", "air conditioner installation"],
          angle: `${state} has a long cooling season, so AC repair and replacement searches matter most, and emergency calls in heatwaves decide who wins the job.`,
          hook: "when it gets hot in {{city}}, the first HVAC company to answer gets the AC repair call. I searched emergency AC repair there and {{company}} wasn't in the map results",
        };
      if (has(p, "cold-winters"))
        return {
          lead: ["furnace repair", "heat pump installation", "HVAC maintenance"],
          angle: `${state} has long winters, so furnace repair, heat pump and maintenance searches come first; tune-up plans before the cold sell well here.`,
          hook: "before winter, homeowners in {{city}} search for furnace repair and tune-ups. {{company}} has great reviews but isn't showing for those searches",
        };
      return {
        lead: ["AC repair", "furnace repair", "HVAC maintenance"],
        angle: `${state} needs both heating and cooling, so check repair searches for each season and pitch maintenance plans to even out demand.`,
        hook: "{{company}} has strong reviews in {{city}}, but it doesn't appear when people search for AC repair or furnace repair",
      };
    case "plumbing":
      if (p.olderHousing)
        return {
          lead: ["sewer line repair", "leak detection", "water heater repair"],
          angle: `Older housing in ${state} means ageing pipes and sewer lines, so sewer, leak and water heater searches are higher-ticket openings for plumbers here.`,
          hook: "older homes around {{city}} mean a lot of sewer line and leak searches, which are bigger jobs than a blocked sink. {{company}} doesn't have a page for either",
        };
      if (has(p, "cold-winters"))
        return {
          lead: ["emergency plumber", "leak detection", "water heater repair"],
          angle: `Freezing winters in ${state} bring burst pipes and failed water heaters, so emergency and leak searches come first.`,
          hook: "when pipes freeze in {{city}}, people search for an emergency plumber and call the first number they see. I tried {{company}}'s line after hours and it went to voicemail",
        };
      return {
        lead: ["emergency plumber", "drain cleaning", "water heater installation"],
        angle: `In ${state}, emergency and drain searches drive most plumbing calls, so answer speed and click-to-call matter as much as rankings.`,
        hook: "I searched emergency plumber in {{city}} and {{company}} wasn't in the top results, even with better reviews than two that were",
      };
    case "electrical":
      if (has(p, "hurricane", "coastal-storms", "cold-winters"))
        return {
          lead: ["generator installation", "emergency electrician", "panel upgrade"],
          angle: `Storms and outages in ${state} make standby generators a high-ticket search; pair it with emergency and panel work.`,
          hook: "after the last outage in {{city}}, homeowners were searching for generator installation. {{company}} installs them but doesn't have a page for it",
        };
      if (p.olderHousing)
        return {
          lead: ["panel upgrade", "electrical repair", "EV charger installation"],
          angle: `Older homes in ${state} often need panel upgrades before an EV charger or heat pump can go in, so lead with panel and repair searches.`,
          hook: "older homes around {{city}} often need a panel upgrade before an EV charger can go in. {{company}} doesn't show up when people search for either",
        };
      return {
        lead: ["EV charger installation", "panel upgrade", "electrician"],
        angle: `In ${state}, EV charger and panel upgrade searches are higher-ticket niches worth leading with.`,
        hook: "more homeowners in {{city}} are searching for EV charger installation, and {{company}} isn't in those results yet",
      };
    case "solar":
      if (p.solar === "strong")
        return {
          lead: ["solar panel installation", "solar installers", "home battery installation"],
          angle: `${state} has a strong solar resource, so installation searches are competitive; the pitch is a lower cost per signed contract, not more leads.`,
          hook: "{{company}} is up against a lot of installers for solar panel installation in {{city}}. I had an idea to lower your cost per signed contract",
        };
      if (p.solar === "good")
        return {
          lead: ["solar panel installation", "solar panel cost", "home battery installation"],
          angle: `Solar works well in ${state}, and many homeowners start by searching for cost, so cost and payback pages are a strong opening.`,
          hook: "homeowners in {{city}} search solar panel cost before they ask anyone for a quote. {{company}} doesn't have a page answering it",
        };
      return {
        lead: ["home battery installation", "solar panel cost", "solar companies"],
        angle: `${state} has a lower solar resource, so buyers weigh cost and backup power carefully; lead with battery and cost searches.`,
        hook: "in {{city}}, a lot of solar interest starts with backup power. {{company}} isn't showing for home battery installation",
      };
    case "general-contractors":
      if (p.fastGrowing)
        return {
          lead: ["home addition contractor", "ADU builder", "custom home builder"],
          angle: `${state} is one of the faster-growing states, so additions, ADUs and custom homes are searched separately; a page per service gives the pitch something concrete.`,
          hook: "with {{city}} growing, more people search for ADU builders and home additions. {{company}} builds both but only has one general services page",
        };
      return {
        lead: ["home renovation contractor", "home addition contractor", "general contractor"],
        angle: `In ${state}, renovation and addition searches matter most for residential GCs; commercial GCs win through bids instead.`,
        hook: "I looked at {{company}}'s project photos, and they're stronger than anything ranking for home renovation contractor in {{city}}",
      };
    case "remodeling":
      if (p.olderHousing)
        return {
          lead: ["kitchen remodeling", "bathroom remodeling", "home remodeling contractor"],
          angle: `Older homes in ${state} drive kitchen and bathroom updates, so lead with those searches and before-and-after photos.`,
          hook: "older homes around {{city}} mean a lot of kitchen and bathroom remodels. {{company}}'s before-and-after photos would beat what currently ranks",
        };
      if (has(p, "cold-winters"))
        return {
          lead: ["basement finishing", "kitchen remodeling", "bathroom remodeling"],
          angle: `Long winters in ${state} make basement finishing a common project; pair it with kitchen and bath searches.`,
          hook: "people in {{city}} search for basement finishing every winter, and {{company}} doesn't have a page for it",
        };
      return {
        lead: ["kitchen remodeling", "bathroom remodeling", "bathroom renovation"],
        angle: `In ${state}, kitchen and bathroom searches are the core of remodeling demand.`,
        hook: "{{company}} has great kitchen photos, but it isn't showing up for kitchen remodeling in {{city}}",
      };
    default:
      return null;
  }
}

export function buildStatePitch(tradeSlug: string, stateName: string, profile: StateProfile, cities: string[]): StatePitch | null {
  const hub = getTradeHubContent(tradeSlug);
  const a = pickAngle(tradeSlug, stateName, profile);
  if (!hub?.searchTerms?.length || !a) return null;
  const terms = [...a.lead, ...hub.searchTerms.filter((t) => !a.lead.includes(t))];
  const grid = cities.slice(0, 4).map((city) => ({ city, searches: a.lead.map((t) => `${t} ${city}`) }));
  const firstCity = cities[0] ?? stateName;
  const opener = `Hi {{first_name}}, ${a.hook.replaceAll("{{city}}", firstCity)}. Worth a quick look at what's missing?`;
  return { angle: a.angle, terms, grid, opener };
}
