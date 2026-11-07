/**
 * Real, checkable facts about each US state that change how contractors in each trade
 * win work: Census division, neighbouring states, climate exposures, solar resource,
 * and whether the state is one of the faster-growing ones.
 *
 * These are coarse, well-documented classifications (for example the Great Plains hail
 * belt or the Gulf and South Atlantic hurricane coast). They deliberately avoid precise
 * counts that we cannot source, so every statement built from them stays true.
 */

export type ClimateExposure =
  | "hail" // Great Plains / Front Range hail belt
  | "hurricane" // Gulf and South Atlantic hurricane coast
  | "coastal-storms" // Northeast and Mid-Atlantic coast: nor'easters and tropical remnants
  | "tornado" // Tornado Alley and the Southeast ("Dixie Alley")
  | "wildfire" // Western wildfire regions
  | "cold-winters" // Snow, ice and freezing temperatures for a large part of the year
  | "long-heat"; // Long, hot cooling season

export type SolarResource = "strong" | "good" | "lower";

export type StateProfile = {
  code: string;
  /** US Census Bureau division */
  division: string;
  /** Four bordering states, or the nearest states where fewer than four border it */
  neighbours: [string, string, string, string];
  /** True when all four neighbours share a land border */
  allBordering: boolean;
  exposures: ClimateExposure[];
  solar: SolarResource;
  /** Among the faster-growing states by population in recent Census estimates */
  fastGrowing: boolean;
  /** Much of the housing stock is older (Northeast and older Midwest states) */
  olderHousing: boolean;
};

const P = (
  code: string,
  division: string,
  neighbours: [string, string, string, string],
  exposures: ClimateExposure[],
  solar: SolarResource,
  opts: { fastGrowing?: boolean; olderHousing?: boolean; allBordering?: boolean } = {},
): StateProfile => ({
  code,
  division,
  neighbours,
  allBordering: opts.allBordering ?? true,
  exposures,
  solar,
  fastGrowing: opts.fastGrowing ?? false,
  olderHousing: opts.olderHousing ?? false,
});

const NE = "New England";
const MA = "Middle Atlantic";
const ENC = "East North Central";
const WNC = "West North Central";
const SA = "South Atlantic";
const ESC = "East South Central";
const WSC = "West South Central";
const MTN = "Mountain";
const PAC = "Pacific";

export const STATE_PROFILES: Record<string, StateProfile> = Object.fromEntries(
  [
    P("AL", ESC, ["MS", "TN", "GA", "FL"], ["hurricane", "tornado", "long-heat"], "good"),
    P("AK", PAC, ["WA", "OR", "ID", "MT"], ["cold-winters", "wildfire"], "lower", { allBordering: false }),
    P("AZ", MTN, ["CA", "NV", "UT", "NM"], ["long-heat", "wildfire"], "strong", { fastGrowing: true }),
    P("AR", WSC, ["MO", "TN", "LA", "TX"], ["tornado", "long-heat"], "good"),
    P("CA", PAC, ["OR", "NV", "AZ", "WA"], ["wildfire", "long-heat"], "strong", { allBordering: false }),
    P("CO", MTN, ["WY", "NE", "KS", "UT"], ["hail", "wildfire", "cold-winters"], "strong"),
    P("CT", NE, ["NY", "MA", "RI", "NJ"], ["coastal-storms", "cold-winters"], "lower", { olderHousing: true, allBordering: false }),
    P("DE", SA, ["MD", "PA", "NJ", "VA"], ["coastal-storms"], "good", { allBordering: false }),
    P("FL", SA, ["GA", "AL", "SC", "MS"], ["hurricane", "long-heat"], "good", { fastGrowing: true, allBordering: false }),
    P("GA", SA, ["FL", "AL", "TN", "SC"], ["hurricane", "tornado", "long-heat"], "good", { fastGrowing: true }),
    P("HI", PAC, ["CA", "OR", "WA", "NV"], ["hurricane", "long-heat"], "strong", { allBordering: false }),
    P("ID", MTN, ["WA", "OR", "MT", "UT"], ["wildfire", "cold-winters"], "good", { fastGrowing: true }),
    P("IL", ENC, ["WI", "IN", "IA", "MO"], ["tornado", "cold-winters"], "lower", { olderHousing: true }),
    P("IN", ENC, ["IL", "OH", "MI", "KY"], ["tornado", "cold-winters"], "lower"),
    P("IA", WNC, ["MN", "WI", "IL", "MO"], ["hail", "tornado", "cold-winters"], "good"),
    P("KS", WNC, ["NE", "MO", "OK", "CO"], ["hail", "tornado"], "good"),
    P("KY", ESC, ["TN", "OH", "IN", "WV"], ["tornado"], "lower"),
    P("LA", WSC, ["TX", "AR", "MS", "AL"], ["hurricane", "tornado", "long-heat"], "good", { allBordering: false }),
    P("ME", NE, ["NH", "VT", "MA", "NY"], ["cold-winters", "coastal-storms"], "lower", { olderHousing: true, allBordering: false }),
    P("MD", SA, ["VA", "PA", "DE", "WV"], ["coastal-storms"], "good"),
    P("MA", NE, ["NY", "CT", "RI", "NH"], ["coastal-storms", "cold-winters"], "lower", { olderHousing: true }),
    P("MI", ENC, ["OH", "IN", "WI", "IL"], ["cold-winters"], "lower", { olderHousing: true, allBordering: false }),
    P("MN", WNC, ["WI", "IA", "ND", "SD"], ["cold-winters", "hail"], "good"),
    P("MS", ESC, ["LA", "AR", "TN", "AL"], ["hurricane", "tornado", "long-heat"], "good"),
    P("MO", WNC, ["IL", "KS", "AR", "IA"], ["hail", "tornado"], "good"),
    P("MT", MTN, ["ID", "WY", "ND", "SD"], ["cold-winters", "wildfire", "hail"], "good"),
    P("NE", WNC, ["KS", "IA", "SD", "CO"], ["hail", "tornado", "cold-winters"], "good"),
    P("NV", MTN, ["CA", "AZ", "UT", "OR"], ["long-heat", "wildfire"], "strong", { fastGrowing: true }),
    P("NH", NE, ["VT", "ME", "MA", "NY"], ["cold-winters"], "lower", { olderHousing: true, allBordering: false }),
    P("NJ", MA, ["NY", "PA", "DE", "CT"], ["coastal-storms"], "lower", { olderHousing: true, allBordering: false }),
    P("NM", MTN, ["AZ", "CO", "TX", "OK"], ["long-heat", "wildfire"], "strong"),
    P("NY", MA, ["NJ", "PA", "CT", "VT"], ["cold-winters", "coastal-storms"], "lower", { olderHousing: true }),
    P("NC", SA, ["VA", "SC", "TN", "GA"], ["hurricane"], "good", { fastGrowing: true }),
    P("ND", WNC, ["MN", "SD", "MT", "WY"], ["cold-winters", "hail"], "good", { allBordering: false }),
    P("OH", ENC, ["PA", "MI", "IN", "KY"], ["cold-winters"], "lower", { olderHousing: true }),
    P("OK", WSC, ["TX", "KS", "AR", "MO"], ["hail", "tornado", "long-heat"], "good"),
    P("OR", PAC, ["WA", "CA", "ID", "NV"], ["wildfire"], "lower"),
    P("PA", MA, ["NY", "NJ", "OH", "MD"], ["cold-winters"], "lower", { olderHousing: true }),
    P("RI", NE, ["MA", "CT", "NY", "NH"], ["coastal-storms", "cold-winters"], "lower", { olderHousing: true, allBordering: false }),
    P("SC", SA, ["NC", "GA", "FL", "TN"], ["hurricane", "long-heat"], "good", { fastGrowing: true, allBordering: false }),
    P("SD", WNC, ["ND", "MN", "NE", "IA"], ["hail", "cold-winters"], "good"),
    P("TN", ESC, ["KY", "GA", "NC", "AL"], ["tornado"], "good", { fastGrowing: true }),
    P("TX", WSC, ["OK", "NM", "LA", "AR"], ["hail", "hurricane", "tornado", "long-heat"], "strong", { fastGrowing: true }),
    P("UT", MTN, ["NV", "AZ", "CO", "ID"], ["wildfire", "cold-winters"], "strong", { fastGrowing: true }),
    P("VT", NE, ["NH", "NY", "MA", "ME"], ["cold-winters"], "lower", { olderHousing: true, allBordering: false }),
    P("VA", SA, ["NC", "MD", "WV", "TN"], ["coastal-storms"], "good"),
    P("WA", PAC, ["OR", "ID", "CA", "MT"], ["wildfire"], "lower", { allBordering: false }),
    P("WV", SA, ["VA", "PA", "OH", "KY"], [], "lower", { olderHousing: true }),
    P("WI", ENC, ["MN", "MI", "IL", "IA"], ["cold-winters"], "lower", { olderHousing: true }),
    P("WY", MTN, ["MT", "CO", "SD", "NE"], ["hail", "cold-winters", "wildfire"], "good"),
  ].map((p) => [p.code, p]),
);

// Major cities per US state (top 5 where available)
export const STATE_CITIES: Record<string, string[]> = {
  AL: ["Birmingham", "Huntsville", "Montgomery", "Mobile", "Tuscaloosa"],
  AK: ["Anchorage", "Fairbanks", "Juneau", "Wasilla", "Kenai"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale"],
  AR: ["Little Rock", "Fayetteville", "Fort Smith", "Springdale", "Jonesboro"],
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Sacramento"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood"],
  CT: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury"],
  DE: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna"],
  FL: ["Miami", "Orlando", "Tampa", "Jacksonville", "St. Petersburg"],
  GA: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah"],
  HI: ["Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu"],
  ID: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello"],
  IL: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford"],
  IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
  ME: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"],
  MD: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie"],
  MA: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
  MI: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor"],
  MN: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington"],
  MS: ["Jackson", "Gulfport", "Southaven", "Biloxi", "Hattiesburg"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"],
  MT: ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
  NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
  NH: ["Manchester", "Nashua", "Concord", "Dover", "Rochester"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison"],
  NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"],
  NY: ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
  ND: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond"],
  OR: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie"],
  RI: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence"],
  SC: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Greenville"],
  SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
  TX: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
  UT: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"],
  VT: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier"],
  VA: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
  WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],
  WY: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"],
};

/** The five largest cities for a state, or an empty list. */
export function topCitiesForState(code: string): string[] {
  return STATE_CITIES[code] ?? [];
}

export function getStateProfile(code: string): StateProfile | undefined {
  return STATE_PROFILES[code];
}

const EXPOSURE_LABEL: Record<ClimateExposure, string> = {
  hail: "Hail",
  hurricane: "Hurricanes",
  "coastal-storms": "Coastal storms",
  tornado: "Tornadoes",
  wildfire: "Wildfire",
  "cold-winters": "Cold winters",
  "long-heat": "Long, hot summers",
};

export function exposureLabels(profile: StateProfile): string[] {
  return profile.exposures.map((e) => EXPOSURE_LABEL[e]);
}

export type StateInsight = {
  /** What drives demand for this trade in this state (2-4 bullets) */
  demandDrivers: string[];
  /** When agencies should reach out (2-3 bullets) */
  outreachTiming: string[];
  /** One-sentence pitch angle that follows from the drivers */
  angle: string;
  faqs: Array<{ q: string; a: string }>;
};

const has = (p: StateProfile, e: ClimateExposure) => p.exposures.includes(e);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Trade-specific insights for one state, built only from the profile facts above.
 */
export function buildStateInsight(
  tradeSlug: string,
  tradeName: string,
  stateName: string,
  profile: StateProfile,
  topCities: string[],
): StateInsight {
  const trade = tradeName.toLowerCase().replace(/\bhvac\b/g, "HVAC");
  const drivers: string[] = [];
  const timing: string[] = [];
  let angle = "";

  switch (tradeSlug) {
    case "roofing": {
      if (has(profile, "hail"))
        drivers.push(`${stateName} sits in the hail belt. Hail season, roughly spring through summer, drives insurance-backed roof replacements and sudden spikes in demand after storms.`);
      if (has(profile, "hurricane"))
        drivers.push(`Hurricane season (June 1 to November 30) brings wind and water damage, so storm repair, insurance claims and re-roofing surge after each event.`);
      if (has(profile, "coastal-storms"))
        drivers.push(`Nor'easters and coastal storms cause wind damage and leaks, keeping repair demand steady through autumn and winter.`);
      if (has(profile, "tornado"))
        drivers.push(`Tornado and severe-thunderstorm seasons create bursts of urgent repair work in affected areas.`);
      if (has(profile, "cold-winters"))
        drivers.push(`Snow load, ice dams and freeze-thaw cycles drive winter repairs, while most replacement work is booked from spring to autumn.`);
      if (has(profile, "wildfire"))
        drivers.push(`Wildfire risk makes fire-rated (Class A) roofing and ember-resistant details a real selling point.`);
      if (has(profile, "long-heat"))
        drivers.push(`Intense sun and heat shorten roof life and make reflective, energy-saving roofing easier to sell.`);
      drivers.push("Most asphalt shingle roofs need replacing after roughly 20 to 30 years, so older neighbourhoods produce steady replacement demand.");
      timing.push(
        has(profile, "hail") || has(profile, "tornado")
          ? "Late winter to early spring, before storm season, is the best time to pitch storm-response marketing."
          : has(profile, "hurricane")
            ? "Pitch in spring before hurricane season, then again after storms when roofers need help managing demand."
            : "Pitch in late winter so campaigns are live before the spring replacement season.",
      );
      timing.push("Avoid the week after a major storm for long sales calls: owners are on roofs. A short email with a clear offer works better.");
      angle = `Lead with storm-ready marketing for ${stateName}: Local Services Ads, a claims and repair landing page, and review generation after every job.`;
      break;
    }
    case "hvac": {
      if (has(profile, "long-heat")) {
        drivers.push(`${stateName} has a long cooling season, so air-conditioning repair and replacement drive most HVAC revenue, peaking in summer.`);
        timing.push("Pitch in late winter and early spring, before the first heat wave fills schedules.");
      }
      if (has(profile, "cold-winters")) {
        drivers.push(`Cold winters make furnace, boiler and heat-pump service essential, with emergency no-heat calls from late autumn onward.`);
        timing.push("Pitch in late summer so heating tune-up and replacement campaigns are live before the first cold snap.");
      }
      if (!has(profile, "long-heat") && !has(profile, "cold-winters")) {
        drivers.push(`${stateName} has a mixed climate with both heating and cooling seasons, which suits heat pumps and twice-yearly maintenance plans.`);
        timing.push("Pitch in the shoulder seasons (spring and early autumn), before each peak.");
      }
      if (has(profile, "wildfire")) drivers.push("Wildfire smoke raises interest in air filtration and indoor air quality upgrades.");
      if (has(profile, "hurricane")) drivers.push("Storms and humidity add demand for dehumidification and post-storm system checks.");
      drivers.push("Maintenance plans smooth out seasonal swings, so recurring-revenue offers resonate with owners.");
      timing.push("Mid-peak, keep outreach short: owners are booked solid and respond to quick, specific offers.");
      angle = `Pitch peak-season readiness: search ads and Local Services Ads before the rush, and maintenance-plan campaigns to existing ${stateName} customers in the quiet months.`;
      break;
    }
    case "plumbing": {
      if (has(profile, "cold-winters"))
        drivers.push(`Freezing temperatures make frozen and burst pipes a winter emergency across ${stateName}, along with water-heater failures.`);
      if (has(profile, "hurricane") || has(profile, "coastal-storms"))
        drivers.push("Storm flooding and power outages drive demand for sump pumps, backflow prevention and water-damage repairs.");
      if (profile.olderHousing)
        drivers.push(`Much of ${stateName}'s housing stock is older, so pipe replacement, repiping and drain work are steady sources of jobs.`);
      if (profile.fastGrowing)
        drivers.push(`${stateName} is one of the faster-growing states, adding new homes and new customers who have no plumber yet.`);
      drivers.push("Emergency searches convert fastest, so call answering speed and Local Services Ads matter more than in most trades.");
      timing.push(
        has(profile, "cold-winters")
          ? "Pitch in autumn, before freeze season, so emergency campaigns are live for the first cold snap."
          : "Plumbing demand is steady year-round; any month works, with extra urgency before storm season.",
      );
      timing.push("Call during business hours and note how fast they answer: slow answering is itself a strong pitch.");
      angle = `Lead with emergency capture in ${stateName}: Local Services Ads, a 24/7 emergency page, click-to-call and missed-call text-back.`;
      break;
    }
    case "electrical": {
      if (has(profile, "hurricane") || has(profile, "coastal-storms") || has(profile, "tornado") || has(profile, "cold-winters"))
        drivers.push(`Storm and winter power outages in ${stateName} drive demand for standby generators, transfer switches and panel upgrades.`);
      if (has(profile, "wildfire"))
        drivers.push("In wildfire areas, utility power shutoffs during high fire risk raise interest in backup power and battery systems.");
      if (has(profile, "long-heat"))
        drivers.push("Heavy air-conditioning loads push older homes toward panel and service upgrades.");
      if (profile.olderHousing)
        drivers.push(`Older homes in ${stateName} often need rewiring and panel replacements to meet modern loads.`);
      drivers.push("EV chargers and solar-ready panel upgrades are growing, higher-ticket services that electricians want more of.");
      timing.push("Pitch generator and panel campaigns ahead of storm or winter season, when homeowners think about outages.");
      timing.push("EV charger campaigns work year-round; pair them with search ads on installation terms.");
      angle = `Pitch higher-ticket work for ${stateName} electricians: generator, panel upgrade and EV charger landing pages with search ads behind them.`;
      break;
    }
    case "solar": {
      drivers.push(
        profile.solar === "strong"
          ? `${stateName} has strong solar resource, among the best in the US, which makes payback stories easy to tell.`
          : profile.solar === "good"
            ? `${stateName} has good solar resource; savings depend on local electricity rates and available incentives.`
            : `${stateName} has fewer sun hours than the sunniest states, so solar sells on electricity rates, incentives and battery backup rather than sunshine alone.`,
      );
      drivers.push(`Incentives and net-metering rules vary by state and utility; check the DSIRE database for current ${stateName} programs before you pitch numbers.`);
      if (has(profile, "hurricane") || has(profile, "coastal-storms") || has(profile, "wildfire") || has(profile, "cold-winters"))
        drivers.push("Outage risk makes solar plus battery storage a resilience purchase, not only a savings one.");
      if (profile.fastGrowing) drivers.push(`Fast population growth in ${stateName} adds new homeowners every year.`);
      timing.push("Pitch in late winter and spring, when homeowners notice bills and plan home projects.");
      timing.push("Lead with installers that have strong reviews but weak websites or no ads: they convert fastest on a tighter market.");
      angle = `For ${stateName} installers, lead with trust: reviews, financing clarity and battery-backup messaging, backed by Meta and search ads.`;
      break;
    }
    case "general-contractors": {
      if (profile.fastGrowing)
        drivers.push(`${stateName} is one of the faster-growing states, fuelling new construction, additions and custom homes.`);
      if (has(profile, "hurricane") || has(profile, "coastal-storms") || has(profile, "tornado"))
        drivers.push("Storm damage creates rebuild and mitigation projects, often insurance funded.");
      if (has(profile, "wildfire")) drivers.push("Wildfire rebuilds and fire-resistant construction are a growing specialty.");
      if (has(profile, "cold-winters"))
        drivers.push("A shorter outdoor building season means owners book spring and summer work early, so marketing must run in winter.");
      if (profile.olderHousing)
        drivers.push(`An older housing stock keeps renovation and addition work steady in ${stateName}.`);
      drivers.push("High project values mean one extra signed job per quarter usually covers an agency's fee.");
      timing.push(
        has(profile, "cold-winters")
          ? "Pitch from December to March so campaigns fill the building season."
          : "Pitch any time of year; avoid peak project-completion weeks before holidays.",
      );
      timing.push("Lead with residential and remodel-focused GCs; large commercial GCs win work through bids, not search.");
      angle = `Show ${stateName} GCs their visibility gap on high-ticket searches (additions, kitchens, custom homes) and offer a project-gallery site with search ads.`;
      break;
    }
    case "remodeling": {
      if (profile.olderHousing)
        drivers.push(`Much of ${stateName}'s housing stock is older, which keeps kitchen, bathroom and whole-home remodels in steady demand.`);
      if (profile.fastGrowing)
        drivers.push(`${stateName} is one of the faster-growing states, so many homeowners are personalising recently bought homes.`);
      if (has(profile, "hurricane") || has(profile, "coastal-storms"))
        drivers.push("After storms, interior rebuilds and water-damage remodels add insurance-funded projects.");
      if (has(profile, "cold-winters"))
        drivers.push("Interior projects such as kitchens, bathrooms and basements dominate in winter, when outdoor work slows.");
      if (has(profile, "long-heat"))
        drivers.push("Energy-efficient windows, insulation and outdoor living spaces are popular upgrades in hot months.");
      drivers.push("Homeowners research remodels for months, so portfolios, reviews and nurture emails decide who gets the call.");
      timing.push("Pitch in January and February, when homeowners plan the year's projects and remodelers plan marketing.");
      timing.push("A second window opens in late summer for projects homeowners want finished before the holidays.");
      angle = `Lead with trust for ${stateName} remodelers: room-by-room galleries, review generation and search ads on kitchen and bathroom terms.`;
      break;
    }
    default: {
      drivers.push(`Demand for ${trade} work in ${stateName} follows local housing, weather and population trends.`);
      timing.push("Pitch a month or two before the trade's busiest season.");
      angle = `Lead with the clearest visible gap for each ${stateName} business: website, reviews or ads.`;
    }
  }

  // Every page needs at least two true demand drivers (some states have no strong weather factor).
  if (drivers.length < 2)
    drivers.push(
      `${stateName} has no single dominant weather risk, so ${trade} demand follows housing age, home sales and routine maintenance more than storms.`,
    );

  const cityList = topCities.slice(0, 3).join(", ");
  const exposures = exposureLabels(profile);
  const faqs = [
    {
      q: `When is the best time to pitch ${trade} companies in ${stateName}?`,
      a: `${timing[0]} ${timing[1] ?? ""}`.trim(),
    },
    {
      q: `What drives demand for ${trade} work in ${stateName}?`,
      a: drivers.slice(0, 2).join(" "),
    },
    {
      q: `Which ${stateName} cities should I start with?`,
      a: `Start with the largest metros, ${cityList}, where there are the most ${trade} businesses to compare. Then expand to smaller cities, where competition between agencies is lower and owners are often easier to reach.`,
    },
    {
      q: `How do I confirm who owns a ${trade} company in ${stateName}?`,
      a: `Use two sources that agree: the ${stateName} contractor license lookup where the trade is licensed (it usually names the license holder or qualifier), the ${stateName} secretary of state business filing, the company website's About page, or owner replies to Google reviews. Contractor Leads adds owner names where they can be confirmed.`,
    },
    {
      q: `How many ${trade} businesses can I find in ${stateName}?`,
      a: `It changes daily as businesses open and close, so Contractor Leads searches live Google data instead of publishing a fixed number. Run a free search for ${trade} in ${stateName} to see the current count, with owner names and AI scores.`,
    },
  ];
  if (exposures.length) {
    faqs.splice(2, 0, {
      q: `How does ${stateName}'s weather affect ${trade} marketing?`,
      a: `${stateName}'s main weather factors for contractors are: ${exposures.map(lowerFirst).join(", ")}. ${angle}`,
    });
  }

  return { demandDrivers: drivers.slice(0, 4), outreachTiming: timing.slice(0, 3), angle, faqs: faqs.slice(0, 6) };
}
